/**
 * Copyright (c) 2011 Chris Adler
 *               2013 Paul Geromini 
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

/*
#ignore(javax.*)
 */

qx.Mixin.define("aiagallery.dbif.MFlags",
{
  construct : function()
  {
    this.registerService("aiagallery.features.flagIt",
                         this.flagIt,
                         [ "flagType", 
                           "explanationInput", 
                           "appId", 
                           "commentId" 
                         ]);

    this.registerService("aiagallery.features.clearAppFlags",
                         this.clearAppFlags,
                         [ "uid" ]);

    this.registerService("aiagallery.features.clearProfileFlags",
                         this.clearProfileFlags,
                         [ "displayName" ]);

    this.registerService("aiagallery.features.clearProfileFlagsWithId",
                         this.clearProfileFlagsWithId,
                         [ "id" ]);

    this.registerService("aiagallery.features.getFlags",
                         this.getFlags,
                         [ "flagType" ]);
  },

  members :
  {
    /**
     *  Add one to the number of times this app has been flagged 
     * 
     * @param flagType{Integer}
     *   This is the value of the type of flag that got submitted
     *   (App  : 0, Comment  : 1 )
     *   
     * @param explanationInput{String}
     *   This is the string the user will input as the reason the app or comment
     *   is being flagged.
     * 
     * @param appId {Integer}
     *   This is either a string or number which is the uid of the app which is
     *   being liked.
     * 
     * @param commentId{String}
     *   This is the string that is the treeId of the comment. If an app was 
     *   flagged input a null
     * 
     * @param username{String}
     *   This is the string that is the username of the user whose profile is
     *   being flagged
     * 
     * @return {Integer || Status}
     *   This is the value of the status of the application 
     *   (Banned  : 0, Pending : 1, Active  : 2)
     */
    flagIt : function(flagType, explanationInput, appId, 
                      commentId, username, error)
    {

      var            appObj;
      var            appDataObj;
      var            appNum;
      var            result;
      var            criteria;
      var            newFlag;
      var            Data;
      var            flagsList;

      var            visitorId = this.getWhoAmI().id;
      var            maxFlags = aiagallery.dbif.Constants.MAX_FLAGGED;
      var            statusVals = aiagallery.dbif.Constants.Status;
      var            flagTypeVal = aiagallery.dbif.Constants.FlagType;

      // Check what type of element has been flagged.
      switch (flagType)
      {
      case flagTypeVal.App:     // An app was flagged
        // store the applications data
        appObj = new aiagallery.dbif.ObjAppData(appId);
        appDataObj = appObj.getData();
        appNum = appDataObj.uid;

        // check to ensure an already existing app was found 
        if (appObj.getBrandNew())
        {
          // If not return an error
          error.setCode(1);
          error.setMessage(
            "Application with that ID not found. Unable to flag.");
          return error;
        }

        // Construct query criteria for "flags of this app by current visitor"
        criteria = 
          {
            type : "op",
            method : "and",
            children : 
            [
              {
                type  : "element",
                field : "app",
                value : appId
              },
              {
                type  : "element",
                field : "visitor",
                value : visitorId
              },
              {
                type  : "element",
                field : "type",
                value : aiagallery.dbif.Constants.FlagType.App
              }              
            ]
          };

        // Query for the flags of this app by the current visitor
        // (an array, which should have length zero or one).
        flagsList = liberated.dbif.Entity.query("aiagallery.dbif.ObjFlags",
                                                criteria,
                                                null);

        // Only change things if the visitor hasn't already flagged this app
        if (flagsList.length === 0)
        {
          // initialize the new flag to be put on the database
          newFlag = new aiagallery.dbif.ObjFlags();

          // store the new flags data
          var data = newFlag.getData();

          data.type = aiagallery.dbif.Constants.FlagType.App;
          data.app = appNum;
          data.comment = null;
          data.visitor = visitorId;
          data.explanation = explanationInput;

          // increments the apps number of flags
          appDataObj.numCurFlags++;      

          // check if the number of flags is greater than or 
          // equal to the maximum allowed
          if(appDataObj.numCurFlags >= maxFlags)
          {
            // If the app is already pending do not touch the status or 
            // send an email  
            if(appDataObj.status != statusVals.Pending)
            {
              // otherwise set the app to pending and send an email
              appDataObj.status = statusVals.Pending;    
              var appName = appDataObj.title;
              var visitorName = this.getWhoAmI().email;

              var props = new java.util.Properties();
              var session = javax.mail.Session.getDefaultInstance(props, null);
              var msgBody = "The application " + appName + ", " + appNum +
                            " was flagged by " + visitorName + ", " + visitorId;
              var msg = new javax.mail.internet.MimeMessage(session);

              msg.setFrom(new javax.mail.internet.InternetAddress(
                            "derrell.lipman@gmail.com",
                            "App Inventor Gallery Admin"));
              msg.addRecipient(javax.mail.Message.RecipientType.TO,
                               new javax.mail.internet.InternetAddress(
                                 "derrell.lipman@gmail.com",
                                 "App Inventor Gallery Admin"));
              msg.setSubject("An app was flagged");
              msg.setText(msgBody);

              javax.mail.Transport.send(msg);
            }
          }
          // put the apps new data and the new flag on the database
          liberated.dbif.Entity.asTransaction(
            function()
            {
              appObj.put();
              newFlag.put();
            });
        }

        return appDataObj.status;

      case flagTypeVal.Comment: // A comment was flagged
        // store the comments data
        var commentObj = new aiagallery.dbif.ObjComments([appId, commentId]);
        var commentDataObj = commentObj.getData();
        var commentNum = commentDataObj.treeId;

        // check to ensure an already existing comment was found 
        if (commentObj.getBrandNew())
        {
          // if not return an error
          error.setCode(2);
          error.setMessage("Comment not found. Unable to flag.");
          return error;
        }

        // Construct query criteria for 
        //"flags of this comment by current visitor"
        criteria = 
        {
          type : "op",
          method : "and",
          children : 
          [
            {
              type  : "element",
              field : "comment",
              value : commentNum
            },
            {
              type  : "element",
              field : "app",
              value : appId
            },
            {
              type  : "element",
              field : "visitor",
              value : visitorId
            },
            {
              type  : "element",
              field : "type",
              value : aiagallery.dbif.Constants.FlagType.Comment
            }  
          ]
        };

        // Query for the flags of this comment by the current visitor
        // (an array, which should have length zero or one).
        flagsList = liberated.dbif.Entity.query("aiagallery.dbif.ObjFlags",
                                                criteria,
                                                null);

        // Only change things if the visitor hasn't 
        // already flagged this comment
        if (flagsList.length === 0)
        {
          // initialize the new flag to be put on the database
          newFlag = new aiagallery.dbif.ObjFlags();

          // store the flags data 
          var data = newFlag.getData();

          data.type = aiagallery.dbif.Constants.FlagType.Comment;
          data.app = appId;
          data.comment = commentId;
          data.visitor = visitorId;
          data.explanation = explanationInput;

          // increment the number of flags on the comment
          commentDataObj.numCurFlags++;

          // check if the number of flags is greater than or 
          // equal to the maximum allowed
          if(commentDataObj.numCurFlags >= maxFlags)
          {
            // If the comment is already pending do not touch the status or 
            // send an email 
            if(commentDataObj.status != statusVals.Pending)
            {
              // otherwise set the comment to pending and send an email
              commentDataObj.status = statusVals.Pending;    


              var props = new java.util.Properties();
              var session = javax.mail.Session.getDefaultInstance(props, 
                                                                  null);

              var visitorName = this.getWhoAmI().email;
              var msgBody =
                "The comment " + commentNum + " was flagged by " +
                visitorName +", " + visitorId;
              var msg = new javax.mail.internet.MimeMessage(session);

              msg.setFrom(new javax.mail.internet.InternetAddress(
                            "derrell.lipman@gmail.com",
                            "App Inventor Gallery Admin"));
              msg.addRecipient(javax.mail.Message.RecipientType.TO,
                               new javax.mail.internet.InternetAddress(
                                 "derrell.lipman@gmail.com",
                                 "App Inventor Gallery Admin"));
              msg.setSubject("An app was flagged");
              msg.setText(msgBody);

              javax.mail.Transport.send(msg);
            }
          }
          // put the comments new data and the new flag on the database
          liberated.dbif.Entity.asTransaction(
            function()
            {
              commentObj.put();
              newFlag.put();
            });
        }

        return commentDataObj.status;

      case flagTypeVal.Profile: // A profile was flagged
        // Check that this user exists
        // We only recieve the user's string name since
        // passing the user.id number to the frontend is strictly forbidden.
        // Thus a chance exists of a user changing their name before we find
        // their id. The chance is minimal however.
        criteria = 
        {
          type  : "element",
          field : "displayName",
          value : username
        }; 
        
        // Check to ensure name is unique
        var resultList = 
          liberated.dbif.Entity.query("aiagallery.dbif.ObjVisitors", 
                                      criteria);                             

        // Should return one and only one username     
        if (resultList.length != 1) 
        {
          error.setCode(2);
          error.setMessage("The display name you are "
                           + "trying to flag: \"" + username +
                           "\" cannot be found."); 

          return error;
        } else {
            var profileId = resultList[0].id; 
        }

        // User cannot flag their own profile 
        if (profileId == visitorId)
        {
          error.setCode(2);
          error.setMessage("You cannot flag your own profile!"); 

          return error; 
        }

        // Construct query criteria for "flags of this user by current visitor"
        // now that we have the flagged user id and the visitor id
        criteria = 
          {
            type : "op",
            method : "and",
            children : 
            [
              {
                type  : "element",
                field : "profileId",
                value : profileId
              },
              {
                type  : "element",
                field : "visitor",
                value : visitorId
              },
              {
                type  : "element",
                field : "type",
                value : aiagallery.dbif.Constants.FlagType.Profile
              }              
            ]
          };

        // Query for the flags of this app by the current visitor
        // (an array, which should have length zero or one).
        flagsList = liberated.dbif.Entity.query("aiagallery.dbif.ObjFlags",
                                                criteria,
                                                null);

        // Only change things if the visitor 
        // has not already flagged this profile
        if (flagsList.length === 0)
        {
          // initialize the new flag to be put on the database
          newFlag = new aiagallery.dbif.ObjFlags();

          // store the new flags data
          var data = newFlag.getData();

          data.type = aiagallery.dbif.Constants.FlagType.Profile;
          data.app = 0; // Special key value to indicate a profile flag
          data.comment = null;
          data.visitor = visitorId;
          data.profileId = profileId; 
          data.explanation = explanationInput;
 
          // put the new flag on the database
          liberated.dbif.Entity.asTransaction(
            function()
            {
              newFlag.put();
            });
        }

        return true;


      default:
        error.setCode(3);
        error.setMessage("unknown flag type.");
        return error;
      } 

      // Error message should be redone
      error.setCode(4);
      error.setMessage("Reached an un-reachable section in the flagIt rpc.");
      return error;
    },


    /**
     * Remove all flags for a given app (app flags, not comment flags)
     * 
     * @param uid {Integer}
     *   The uid of the app that is being de-flagged
     * 
     * @return uid {Integer}
     *   Returns the uid of the app flag it just cleared
     */
    clearAppFlags : function(uid, error)
    // Based on MApps#deleteApp
    {
      var             appObj;
      var             appData;
      var             title;

      // Retrieve an instance of this application entity
      appObj = new aiagallery.dbif.ObjAppData(uid);
      
      // Does this application exist?
      if (appObj.getBrandNew())
      {
        // It doesn't. Let 'em know.
        return false;
      }

      // Get the object data
      appData = appObj.getData();

      // Save the title, to put into error message if there's a problem.
      title = appData.title;

      liberated.dbif.Entity.asTransaction(
        function()
        {
          // Remove all Flags objects referencing this application
          liberated.dbif.Entity.query("aiagallery.dbif.ObjFlags", 
                                      {
                                        type  : "element",
                                        field : "app",
                                        value : appData.uid
                                      }).forEach(
            function(result)
            {
              var             obj;
              
              // Get this Flags object
              obj = new aiagallery.dbif.ObjFlags(result.uid);
              
              // Assuming it exists (it had better!)...
              if (! obj.getBrandNew())
              {
                // ... then remove this object
                obj.removeSelf();
              }
            });

          // Reset flag count
          appData.numCurFlags = 0;
          // Update DB
          appObj.put();

        });

      // Let the user know flags removed
      this.logMessage(appData.owner, "All flags removed", appData.title);

      // We were successful
      return appData.uid;
    },

    /**
     * Remove all flags for a given profile
     * 
     * @param displayName {String}
     *   Given displayName of the user we are removing flags for.
     *   Cannot use appId so chance exists user could change name before this
     *   function finishes. 
     * 
     * @return displayName {String}
     *   The displayName we just cleared of all flags
     */
     clearProfileFlags : function(displayName, error)
     {
       var        criteria; 
       var        userId; 

       criteria = 
        {
          type  : "element",
           field : "displayName",
          value : displayName
        }; 
        
       // Check to ensure name is unique
       var resultList = 
         liberated.dbif.Entity.query("aiagallery.dbif.ObjVisitors", 
                                     criteria);                             
   
       // Should return one and only one username     
       if (resultList.length != 1) 
       {
         error.setCode(2);
         error.setMessage("The display name you are "
                          + "trying to clear of flag: \"" 
                          + displayName
                          + "\" cannot be found."); 
         return error;
       }
       else
       {
         userId = resultList[0].id; 
       }

       // Delete the user
       this.clearProfileFlagsWithId(userId); 

       // Let the user know flags removed
       this.logMessage(displayName, "All flags removed");  
 
       // We were successful
       return displayName;
     },

    /**
     * Remove profile flags if we have a user id
     * 
     * @param id {Integer}
     *   The visitor's id
     */
     clearProfileFlagsWithId : function(id)
     {

       liberated.dbif.Entity.asTransaction(
         function()
         {
           // Remove all Flags objects referencing this profile
           liberated.dbif.Entity.query("aiagallery.dbif.ObjFlags", 
                                        {
                                         type  : "element",
                                         field : "profileId",
                                         value : id
                                       }).forEach(
           function(result)
           {
             var             obj;
              
              // Get this Flags object
             obj = new aiagallery.dbif.ObjFlags(result.uid);
               
             // Assuming it exists (it had better!)...
             if (! obj.getBrandNew())
             {
               // ... then remove this object
               obj.removeSelf();
             }
           });
       });

     },

    /**
     * Get and return the flags associated with a flag type
     * 
     * @param flagType, the type of flags defined in
     *   aiagallery.dbif.Constants.FlagType if undefined return a mapp
     *   containing all the flag types. 
     * 
     * @param error, the error object that comes with every rpc call
     * 
     * @return a list of objects (comments) or a map (profile / apps)
     *   that have been flagged. Could be empty if 
     *   we found no flags for the specified type.
     */
    getFlags : function(flagType, error)
    {
      var          criteria;
      var          resultList; 
      var          resultMap; 

      if (!flagType)
      { 
        flagType = "ALL"; 
      }

      // Do particular work based on the type of flag we are getting
      switch (flagType)
      {

      case "ALL":
        // Map of returned flags
        resultMap = 
          {
            Apps     : null,
            Profiles : null,
            Comments : null
          };

        resultMap.Apps = this._getAppFlags(error);
        resultMap.Profiles = this._getProfileFlags(error);
        resultMap.Comments = this._getCommentFlags(error);

        return resultMap; 

      case aiagallery.dbif.Constants.FlagType.App:
        return this._getAppFlags(error);

      case aiagallery.dbif.Constants.FlagType.Profile:
        return this._getProfileFlags(error); 

      case aiagallery.dbif.Constants.FlagType.Comment:
        return this._getCommentFlags(error);

      default:
        // Type unrecognized, this is an error
        error.setCode(2);
        error.setMessage("Unrecognized flag type: " + flagType); 
        throw error;
      }

      // Unreachable code section
      error.setCode(2);
      error.setMessage("Reached unreachable code section in getFlags, impressive."); 
      throw error;
      
    },

   /**
    * Helper function to get all the flags associated with comments
    * 
    * @return {Array}
    *   An array containing all the ObjFlag objects related to comments
    */
    _getCommentFlags : function(error)
    {
      var      criteria;
      var      resultList;

      // Retrieve all Active comments for this app
      criteria = 
        {
          type     : "element",
          field    : "numCurFlags",
          value    : 0,
          filterOp : ">"  
        };

      // Issue a query for all flagged comments
      resultList = liberated.dbif.Entity.query("aiagallery.dbif.ObjComments", 
                                               criteria,
                                               null);

      resultList.forEach(function(obj)
        {
          // Add this visitor's display name
          obj.displayName = 
            aiagallery.dbif.MVisitors._getDisplayName(obj.visitor, error);
            
          // Remove the visitor field
          delete obj.visitor;

         criteria = 
            {
              type : "op",
              method : "and",
              children :
              [
                {
 
                  type   : "element",
                  field  : "app",
                  value  : obj.app
                },
                {
                  type   : "element",
                  field  : "comment",
                  value  : obj.treeId 
                }
              ]
            }; 

          // Correlate comments with flags 
          var flagList = liberated.dbif.Entity
            .query("aiagallery.dbif.ObjFlags", 
                   criteria,
                   null);

          obj.objFlag = flagList[0]; 
        });

      return resultList; 
    },

   /**
    * Helper function to get all the flags associated with apps
    * 
    * @return {Array}
    *   An array containing all the ObjFlag objects related to apps
    */
    _getAppFlags : function(error)
    {
      var      criteria;
      var      resultList;

      criteria = 
      {
        type  : "element",
        field : "type",
        value : aiagallery.dbif.Constants.FlagType.App
      };

      // Issue a query for all flagged apps
      resultList = liberated.dbif.Entity.query("aiagallery.dbif.ObjFlags", 
                                               criteria,
                                               null);

      resultList.forEach(function(obj)
        {
          var  titleSearch;
          // Add in app title
          criteria = 
          {
            type  : "element",
            field : "uid",
            value : obj.app
          };

          // Issue a query for all flagged apps
          titleSearch = liberated.dbif.Entity.query("aiagallery.dbif.ObjAppData", 
                                                   criteria,
                                                   null);
          // Should be one result
          obj.appTitle = titleSearch[0].title; 

          // Remove the visitor field
          delete obj.visitor;
        }, this);

      return resultList; 

    },

   /**
    * Helper function to get all the flags associated with profiles
    * 
    * @return {Array}
    *   An array containing all the ObjFlag objects related to profiles
    */
    _getProfileFlags : function (error)
    {
      var      criteria;
      var      resultList;

      // Do a particular search to retrieve all the active flags
      // for this flag type
      criteria =
        {
          type: "element",
          field: "type",
          value: aiagallery.dbif.Constants.FlagType.Profile
        };

      // Issue a query for all flagged user profiles
      resultList = liberated.dbif.Entity.query("aiagallery.dbif.ObjFlags", 
                                               criteria,
                                               null);
      resultList.forEach(function(obj)
        {
          // Replace profileId with flagged users name 
          obj.profileId = 
            aiagallery.dbif.MVisitors._getDisplayName(obj.profileId, error);
          
          // Remove the visitor field
          delete obj.visitor;
        });

      return resultList; 
    }
  }
});
