/**
 * Copyright (c) 2013 Derrell Lipman
 *                    Paul Geromini
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

/**
 * The graphical user interface for the flag management page
 */
qx.Class.define("aiagallery.module.mgmt.flags.Gui",
{
  type : "singleton",
  extend : qx.ui.core.Widget,

  members :
  {
    /**
     * Build the raw graphical user interface.
     *
     * @param module {aiagallery.main.Module}
     *   The module descriptor for the module.
     */
    buildGui : function(module)
    {
      var             o;
      var             fsm = module.fsm;
      var             outerCanvas = module.canvas; 
      var             canvas;
      var             mainScrollContainer;
      var             label; 
      var             appScroller; 
      var             profileScroller; 
      var             commentScroller; 
      var             vBox; 

      this.fsm = fsm; 

      // Put entire page in scroller
      outerCanvas.setLayout(new qx.ui.layout.VBox());
      mainScrollContainer = new qx.ui.container.Scroll();
      outerCanvas.add(mainScrollContainer, { flex : 1 });
 
      canvas = new qx.ui.container.Composite(new qx.ui.layout.VBox(20));
      mainScrollContainer.add(canvas, { flex : 1}); 

      // Create title label
      label = new qx.ui.basic.Label("Flagged Comments");
      canvas.add(label);        

      // Create the scroller to hold all of the comments
      commentScroller = new qx.ui.container.Scroll();
      canvas.add(commentScroller, {flex : 1});  
      
      // The Scroller may contain only one container, so create that container.
      vBox = new qx.ui.layout.VBox();     
      this.commentsScrollContainer = 
        new qx.ui.container.Composite(vBox);
      commentScroller.add(this.commentsScrollContainer);

      // Show flagged apps 
      label = new qx.ui.basic.Label("Flagged Apps");
      canvas.add(label);     

      // Create the scroller to hold all of the apps
      appScroller = new qx.ui.container.Scroll();
      canvas.add(appScroller, {flex : 1});
 
      // The Scroller may contain only one container, so create that container.
      vBox = new qx.ui.layout.VBox();     
      this.appScrollContainer = 
        new qx.ui.container.Composite(vBox);
      appScroller.add(this.appScrollContainer);

      // Get some space inbetween these two
      canvas.add(new qx.ui.core.Spacer(25)); 

      // Show flagged profiles
      label = new qx.ui.basic.Label("Flagged Profiles");
      canvas.add(label);  

      // Create the scroller to hold all of the apps
      profileScroller = new qx.ui.container.Scroll();
      canvas.add(profileScroller, {flex : 1}); 

      // The Scroller may contain only one container, so create that container.
      vBox = new qx.ui.layout.VBox();     
      this.profileScrollContainer = 
        new qx.ui.container.Composite(vBox);
      profileScroller.add(this.profileScrollContainer);

    },
   
    /**
     * Handle the response to a remote procedure call
     *
     * @param module {aiagallery.main.Module}
     *   The module descriptor for the module.
     *
     * @param rpcRequest {var}
     *   The request object used for issuing the remote procedure call. From
     *   this, we can retrieve the response and the request type.
     */
    handleResponse : function(module, rpcRequest)
    {
      var             fsm = module.fsm;
      var             response = rpcRequest.getUserData("rpc_response");
      var             requestType = rpcRequest.getUserData("requestType");
      var             result;
      var             childList; 
      var             i;
      var             username;
      var             uid; 
      var             scrollChildren;
      var             commentDB; 
      var             vBoxTotal; 
      var             hBoxData;
      var             hBoxBtns;
      var             label; 
      var              button; 

      // We can ignore aborted requests.
      if (response.type == "aborted")
      {
          return;
      }

      if (response.type == "failed")
      {
        // FIXME: Add the failure to the cell editor window rather than alert
        alert("Async(" + response.id + ") exception: " + response.data);
        return;
      }

      // Successful RPC request.
      // Dispatch to the appropriate handler, depending on the request type
      switch(requestType)
      {

      case "getFlags":

        // Get the list of returned apps
        result = response.data.result;

        // Add app flags if we need to 
        if (result.Apps.length != 0)
        {
          this.appScrollContainer.removeAll(); 

          // For each app flag add a line to the appScroller
          // Contains the title of the app, reason for flagging on line 1
          // On line 2, 3 buttons keep app, remove app, visit app
          result.Apps.forEach(function(obj)
            {

              // Flag Layouts         
              vBoxTotal 
                = new qx.ui.container.Composite(new qx.ui.layout.VBox(10));  

              hBoxData 
                = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));

              hBoxBtns
                = new qx.ui.container.Composite(new qx.ui.layout.HBox(10)); 

              // Add App Data
              label = new qx.ui.basic.Label("App Title: " + obj.appTitle);
              hBoxData.add(label);

              label 
                = new qx.ui.basic.Label("Reason: " + obj.explanation);
              hBoxData.add(label);

              // Add Buttons
              button = new qx.ui.form.Button(this.tr("Keep"));
              button.setUserData("uid", obj.app);
              
              button.addListener(
                "click",
                function(e)
                {
                  // Fire immediate event
                  this.fsm.fireImmediateEvent(
                    "keepApp", this, e.getTarget());
                }, this); 

              hBoxBtns.add(button); 

              button = new qx.ui.form.Button(this.tr("Delete"));
              button.setUserData("uid", obj.app);

              button.addListener(
                "click",
                function(e)
                {
                  var uid = e.getTarget().getUserData("uid"); 

                  dialog.Dialog.confirm(
                    this.tr("Really Delete this App?"),
                    function(result)
                    {
                      if (result)
                      {                   
                        // Fire immediate event
                        this.fsm.fireImmediateEvent(
                          "deleteApp", this, uid);
                      }
                    }, this);
                }, this); 

              hBoxBtns.add(button); 

              button = new qx.ui.form.Button(this.tr("Go To App"));
              button.setUserData("uid", obj.app);
              button.setUserData("title", obj.appTitle);

              button.addListener(
                "click",
                function(e)
                {
                  var title;
                  var uid;

                  uid = e.getTarget().getUserData("uid");
                  title = e.getTarget().getUserData("title");

                  aiagallery.module.dgallery.appinfo.AppInfo
                    .addAppView(uid, title);                
                }); 

              hBoxBtns.add(button); 

              // Add both layouts to main layout
              vBoxTotal.add(hBoxData); 
              vBoxTotal.add(hBoxBtns);

              // Save some identifying info about this layout obj
              vBoxTotal.setUserData("uid", obj.app);

              this.appScrollContainer.add(vBoxTotal); 
               
              // Add space between apps
              this.appScrollContainer.add(new qx.ui.core.Spacer(10));

            }
          ,this);
        }

        // Add profile flags if we need to
        if (result.Profiles.length != 0)
        {
          this.profileScrollContainer.removeAll(); 

          // For each profile flag add a line to the profileScroller
          // Contains the flagged profile name and reason for flagging on line 1
          // On line 2, 3 buttons keep profile, remove profile, visit profile
          result.Profiles.forEach(function(obj)
            {

              // Flag Layouts         
              vBoxTotal 
                = new qx.ui.container.Composite(new qx.ui.layout.VBox(10));  

              hBoxData 
                = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));

              hBoxBtns
                = new qx.ui.container.Composite(new qx.ui.layout.HBox(10)); 

              // Add App Data
              label = new qx.ui.basic.Label("Username: " + obj.profileId);
              hBoxData.add(label);

              label = new qx.ui.basic.Label("Reason: " + obj.explanation);
              hBoxData.add(label);

              // Add Buttons
              button = new qx.ui.form.Button(this.tr("Keep"));
              button.setUserData("username", obj.profileId);

              button.addListener(
                "click",
                function(e)
                {
                  // Fire immediate event
                  this.fsm.fireImmediateEvent(
                    "keepProfile", this, e.getTarget());
                }, this); 

              hBoxBtns.add(button); 

              button = new qx.ui.form.Button(this.tr("Delete"));
              button.setUserData("username", obj.profileId);

              button.addListener(
                "click",
                function(e)
                {
                  var name = e.getTarget().getUserData("username"); 

                  dialog.Dialog.confirm(
                    this.tr("Really Delete this User?"),
                    function(result)
                    {
                      if (result)
                      {                   
                        // Fire immediate event
                        this.fsm.fireImmediateEvent(
                          "deleteProfile", this, name);
                      }
                    }, this);
                }, this); 

              hBoxBtns.add(button); 

              button = new qx.ui.form.Button(this.tr("Go To User Profile"));
              button.setUserData("username", obj.profileId);

              button.addListener(
                "click",
                function(e)
                {
                  var username;

                  username = e.getTarget().getUserData("username");

                  aiagallery.module.dgallery.userinfo.UserInfo
                    .addPublicUserView(username);             
                }); 

              hBoxBtns.add(button); 

              // Add both layouts to main layout
              vBoxTotal.add(hBoxData); 
              vBoxTotal.add(hBoxBtns);

              // Save some identifying info about this layout obj
              vBoxTotal.setUserData("username", obj.profileId);

              this.profileScrollContainer.add(vBoxTotal); 
               
              // Add space between apps
              this.profileScrollContainer.add(new qx.ui.core.Spacer(10));

            }
          ,this);
        }

        if (result.Comments.length != 0)
        {
          // First make sure the commentScrollContainer is clear
          this.commentsScrollContainer.removeAll(); 
        
          // Take the comments that are flagged
          // create new commentDetailBoxes for each of them
          // add them all to the vBox
        
          //result is a list
          for(i in result.Comments)
          {
             // Create a new commentDetailBox object for this comment
            commentDB = new aiagallery.module.dgallery.appinfo.Comment
              (null, fsm, result.Comments[i].treeId, 
              result.Comments[i].app, true);
            commentDB.setText(result.Comments[i].text);
            commentDB.setDisplayName(result.Comments[i].displayName);
            commentDB.setTimestamp(result.Comments[i].timestamp);

            // Add it to the scroll container
            this.commentsScrollContainer.add(commentDB);    
           
            label = new qx.ui.basic.Label("Reason: " 
              + result.Comments[i].objFlag.explanation);

            this.commentsScrollContainer.add(label);
          }
        }

        break;

      case "keepApp":
        
        // Look through the appScroller
        // remove all apps flags with the same app uid
        // of the flag we just cleared
        // result is the uid
        result = response.data.result;

        childList = this.appScrollContainer.getChildren();
         
        for (i = 0; i < childList.length; i++)
        {
          uid = childList[i].getUserData("uid");

          // If the object has the same uid as the flags we just cleared
          // remove it from the layout
          if (uid == result) 
          {
            this.appScrollContainer.remove(childList[i]);
          }
        }

        break; 

      case "deleteApp":
        // Was the delete successful
        result = response.data.result;

        if(result)
        {
          // Grab uid
          uid = rpcRequest.getUserData("uid");

          // Look through the appScroller 
          // remove all profile flags with the same app uid
          // of the flag we just cleared
          childList = this.appScrollContainer.getChildren();
         
          for (i = 0; i < childList.length; i++)
          {
            var compareUid = childList[i].getUserData("uid");

            // If the object has the same uid as the flags we just cleared
            // remove it from the layout
            if (compareUid == uid) 
            {
              this.appScrollContainer.remove(childList[i]);
            }
          }
        }

        break;

      case "keepProfile":
      case "deleteProfile":

        // Look through the profileScroller 
        // remove all profile flags with the same profile name
        // of the flag we just cleared
        result = response.data.result;

        childList = this.profileScrollContainer.getChildren();
         
        for (i = 0; i < childList.length; i++)
        {
          username = childList[i].getUserData("username");

          // If the object has the same uid as the flags we just cleared
          // remove it from the layout
          if (username == result) 
          {
            this.profileScrollContainer.remove(childList[i]);
          }
        }

        break; 

      // Comment was deemed acceptable so keep it
      case "setCommentActive":
      
        // Pop msg of action
        dialog.Dialog.warning(this.tr("Message Kept")); 
        
        // Get comment info
        result = rpcRequest.getUserData("commentInfo"); 
        
        // Remove from list
        scrollChildren = this.commentsScrollContainer.getChildren();
      
        for(i in scrollChildren)
        {
          if(scrollChildren[i].appId == result.appId && 
             scrollChildren[i].treeId == result.treeId)
          {
            // Remove this from the list
            this.commentsScrollContainer.remove(scrollChildren[i]);

            // The very next item is the reason label, remove that too         
            this.commentsScrollContainer.remove(scrollChildren[i]); 
            
            // Found the comment so break
            break;            
          }
        }
      
        break;
        
      case "deleteComment":
      
        // Pop msg of action
        dialog.Dialog.warning(this.tr("Message Deleted")); 
        
        // Get comment info
        result = rpcRequest.getUserData("commentInfo"); 
        
        // Remove from list
        scrollChildren = this.commentsScrollContainer.getChildren();
      
        for(i in scrollChildren)
        {
          if(scrollChildren[i].appId == result.appId && 
             scrollChildren[i].treeId == result.treeId)
          {
            // Remove this from the list
            this.commentsScrollContainer.remove(scrollChildren[i]);

            // The very next item is the reason label, remove that too         
            this.commentsScrollContainer.remove(scrollChildren[i]); 
            
            // Found the comment so break
            break;            
          }
        }
      
        break;

      case "visitComment":
        result = response.data.result;

        // Add a module for the specified app
        aiagallery.module.dgallery.appinfo.AppInfo.addAppView(result.app.uid, 
                                                              result.app.title);

        break; 

      default:
        throw new Error("Unexpected request type: " + requestType);
      }
    }
  }
});
