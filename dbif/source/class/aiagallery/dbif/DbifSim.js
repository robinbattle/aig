/**
 * Copyright (c) 2011 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

qx.Class.define("aiagallery.dbif.DbifSim",
{
  extend  : liberated.sim.Dbif,
  type    : "singleton",

  include : 
  [
    aiagallery.dbif.MDbifCommon,
    aiagallery.dbif.MSimData
  ],
  
  construct : function()
  {
    // Call the superclass constructor
    this.base(arguments);
    
    // Prepare for remote procedure calls to aiagallery.features.*
    this.__rpc = new liberated.sim.Rpc("/rpc");
        
    // Save the logged-in user. The whoAmI property is in MDbifCommon.
    // If you want to test the anonymous user code use the second setWhoAmI
    // If you want to test a regular user use the first.
/**/
    this.setWhoAmI(
      {
        id                : "1001",
        email             : "jane@uphill.org",
        displayName       : "Jane Doe",
        isAdmin           : true,
        logoutUrl         : 
          [
            "javascript:",
            "aiagallery.dbif.DbifSim.changeWhoAmI();"
          ].join(""),
        permissions       : [],
        hasSetDisplayName : true,
        isAnonymous       : false 
      });
/*
   this.setWhoAmI(
      {
        id                : "",
        email             : "Guest",
        displayName       : "",
        isAdmin           : false,
        logoutUrl         : 
        [
          "javascript:",
           "aiagallery.dbif.DbifSim.changeWhoAmI();"
        ].join(""),
        permissions       : [],
        hasSetDisplayName : true,
        isAnonymous       : true  
      });
*/

  },
  
  members :
  {
    __rpc : null,

    /**
     * Register a service name and function.
     *
     * @param serviceName {String}
     *   The name of this service within the <[rpcKey]> namespace.
     *
     * @param fService {Function}
     *   The function which implements the given service name.
     * 
     * @param paramNames {Array}
     *   The names of the formal parameters, in order.
     */
    registerService : function(serviceName, fService, paramNames)
    {
      // Register with the RPC provider
      this.__rpc.registerService(serviceName, fService, this, paramNames);
    }
  },
  
  statics :
  {
    __userNumber : 100,

    changeWhoAmI : function(context)
    {
      var userId = {};

      var formData =  
      {
        'username'   : 
        {
          'type'  : "ComboBox", 
          'label' : "Login",
          'value' : null,
          'options' : [ ]
        },
        'isAdmin'   : 
        {
          'type'  : "SelectBox", 
          'label' : "User type",
          'value' : null,
          'options' : 
          [
            { 'label' : "Normal",        'value' : false }, 
            { 'label' : "Administrator", 'value' : true  }
          ]
        }
      };
      
      // Retrieve all of the visitor records
      liberated.dbif.Entity.query("aiagallery.dbif.ObjVisitors").forEach(
        function(visitor, i)
        {
          // Add this visitor to the list
          formData.username.options.push(
            {
              label : visitor.email
            });
          
          userId[visitor.email] = visitor.id;
        });

      // Add in anon user
      formData.username.options.push(
        {
          label : "anonymous"
        });
 
      userId["anonymous"] = "anonymous";

      dialog.Dialog.form(
        "You have been logged out. Please log in.",
        formData,
        function( result )
        {
          var             visitor;
          var             displayName;
          var             guiWhoAmI;
          var             bHasSetDisplayName;
          var             permissions;
          var             bAnon = false;

          // Try to get this user's display name. Does the visitor exist?
          visitor = liberated.dbif.Entity.query("aiagallery.dbif.ObjVisitors",
                                                userId[result.username]);
          if (visitor.length > 0 && visitor[0].displayName)
          {
            // Yup, he exists and has a known display name.
            displayName = visitor[0].displayName;
            bHasSetDisplayName = true;
            permissions =
              aiagallery.dbif.MVisitors.getVisitorPermissions(visitor[0]);
          }
          else if (result.username == "anonymous")
          {
            // Anon user
            displayName = "Guest";
            bHasSetDisplayName = true;
            permissions = ""; 
            bAnon = true; 
          }
          else
          {
            // He doesn't exist. Just use the unique number.
            displayName = "User #" + aiagallery.dbif.DbifSim.__userNumber++;
            bHasSetDisplayName = false;
            permissions = [];
          }

          // Save the backend whoAmI information
          if (!bAnon)
          {
           aiagallery.dbif.DbifSim.getInstance().setWhoAmI(
           {
              id                : userId[result.username],
              email             : result.username,
              displayName       : displayName,
              isAdmin           : result.isAdmin,
              logoutUrl         :
                [
                  "javascript:",
                  "aiagallery.dbif.DbifSim.changeWhoAmI();"
                ].join(""),
              permissions       : permissions,
              hasSetDisplayName : bHasSetDisplayName,
              isAnonymous       : true
            });
          }
          else 
          {
            aiagallery.dbif.DbifSim.getInstance().setWhoAmI(null); 
            /*
            aiagallery.dbif.DbifSim.getInstance().setWhoAmI(
            {           
              id                : "",
              email             : "anonymous",
              displayName       : "",
              isAdmin           : false,
              logoutUrl         : 
                [
                  "javascript:",
                   "aiagallery.dbif.DbifSim.changeWhoAmI();"
                ].join(""),
               permissions : [],
               hasSetDisplayName : true     
            });
            */
          }
          // Update the gui too
          guiWhoAmI = aiagallery.main.Gui.getInstance().whoAmI;
          guiWhoAmI.setIsAdmin(result.isAdmin);
          guiWhoAmI.setEmail(result.username);
          guiWhoAmI.setDisplayName(displayName);
          guiWhoAmI.setHasSetDisplayName(bHasSetDisplayName);
          guiWhoAmI.setLogoutUrl(
            "javascript:aiagallery.dbif.DbifSim.changeWhoAmI();");
          //guiWhoAmI.setIsAnonymous(result.isAnonymous); 

          // FIXME : If the user went from anonymous to a real user
          // we need to reload the GUI so that the other modules load
        }
      );
    }
  },

  defer : function()
  {
    // Retrieve the database from Web Storage, if such exists.
    if (typeof window.localStorage !== "undefined")
    {
      if (typeof localStorage.simDB == "string")
      {
        qx.Bootstrap.debug("Reading DB from Web Storage");
        liberated.sim.Dbif.setDb(qx.lang.Json.parse(localStorage.simDB));
      }
      else
      {
        // No database yet stored. Retrieve the database from the MSimData mixin
        qx.Bootstrap.debug("No database yet. Using new SIM database.");
        liberated.sim.Dbif.setDb(aiagallery.dbif.MSimData.Db);
      }
    }
    else
    {
      // Retrieve the database from the MSimData mixin
      qx.Bootstrap.debug("No Web Storage available. Using new SIM database.");

      // Convert string appId keys to numbers
      qx.Bootstrap.debug("Beginning appId conversion...");
      var apps = aiagallery.dbif.MSimData.Db["apps"];
      qx.lang.Object.getKeys(apps).forEach(
        function(appId)
        {
          qx.Bootstrap.debug("Converting " + appId);
          apps[parseInt(appId, 10)] = apps[appId];
          delete apps[appId];
        });

      liberated.sim.Dbif.setDb(aiagallery.dbif.MSimData.Db);
    }
    
    // Register our put & query functions
    liberated.dbif.Entity.registerDatabaseProvider(
      liberated.sim.Dbif.query,
      liberated.sim.Dbif.put,
      liberated.sim.Dbif.remove,
      liberated.sim.Dbif.getBlob,
      liberated.sim.Dbif.putBlob,
      liberated.sim.Dbif.removeBlob,
      liberated.sim.Dbif.beginTransaction,
      { 
        dbif        : "sim"
      });
  }
});
