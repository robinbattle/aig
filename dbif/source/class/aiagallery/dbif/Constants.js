/**
 * Copyright (c) 2011 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

qx.Class.define("aiagallery.dbif.Constants",
{
  extend  : qx.core.Object,

  statics :
  {
    /** 
     *  Value of the maximum amount of times an app or comment 
     *  can be flagged 
     */
    MAX_FLAGGED           : 5,

    /** Number of "newest" apps to return by the getHomeRibbonData() RPC */
    RIBBON_NUM_NEWEST     : 20,
    
    /** Number of "most liked" apps to return by the getHomeRibbonData() RPC */
    RIBBON_NUM_MOST_LIKED : 20,
    
    /** Name of the permission group used for the white list */
    WHITELIST             : "Whitelist",


    //
    // DEVELOPER NOTE:
    //
    //   Never change values associated with existing status entries. When
    //   adding new entries, add them at the end of the list, with previously 
    //   unused values. The database contains numeric values that would all
    //   otherwise need to be updated.
    //

    /** Mapping of status names to values */
    Status      : 
    {
      Banned      : 0,
      Pending     : 1,
      Active      : 2,
      Unpublished : 3,
      Invalid     : 4,
      Incomplete  : 5,
      Editing     : 6,
      NotSaved    : 7,
      Uploading   : 8,
      Processing  : 9
    },
    
    /** Reverse mapping of status: values to names */
    StatusToName :
    [
      "Banned", 
      "Under review",
      "Active",
      "Unpublished",
      "Invalid",
      "Incomplete",
      "Editing",
      "Not saved!",
      "Uploading",
      "Processing"
    ],

    /** Maximum length of input fields */
    FieldLength :
    {
      Title       : 30,
      Description : 480,
      Tags        : 20,
      Comment     : 480,
      Bio         : 480,
      Group       : 480, 
      User        : 100 
    },

    /** Mapping of FlagType names to values */
    FlagType      : 
    {
      App  : 0,
      Comment : 1
    },

    /** Reverse mapping of FlagType values to names */
    FlagTypeToName :
    [
      "App", 
      "Comment"
    ],

    /** List of dissalowed usernames */
    unallowedNames : 
    [
      "admin", 
      "administrator", 
      "guest", 
      "superuser", 
      "root"
    ],

    /** Status of a user in realtion to a group */
    GroupStatus :
    {
      NonMember : 0,
      WaitList  : 1,
      Requested : 2,
      Memeber   : 3, 
      Owner     : 4
    },

    /** Mapping of permission names to descriptions */
    Permissions :
    {
      //
      // MApps
      //
      "addOrEditApp"      : "Add and edit applications",
      "deleteApp"         : "Delete applications",
      "getAppListAll"     : "Get all users application list",
      "mgmtEditApp"       : "Managment override for application management",
      "setFeaturedApps"   : "Specify the set of featured apps",

      // Anonymous access...
      "getAppList"               : "Get logged in user application list",
      "getHomeRibbonData"        : "Retrieve apps displayed on home page",
      "appQuery"                 : "Query for applications",
      "intersectKeywordAndQuery" : "Get intersection of keyword search and" +
                                   "appQuery",
      "getAppListByList"         : "Get list of apps given list of UIDs",
      "getAppInfo"               : "Get application detail information",
      // ... Anonymous access
      
      //
      // MComments
      //
      "addComment"   : "Add comments to an application",
      "deleteComment": "Delete comments from an application",
      
      // Anonymous access...
      "getComments"  : "Retrieve comments about an application",
      // ... Anonymous access
      
      //
      // MFlags
      //
      "flagIt"         : "Flag an app or comment",
      "clearAppFlags"  : "Clear all of an app's flags, and reset count to 0",
      
      //
      // MMobile
      //
      // Anonymous access...
      "mobileRequest" : "Mobile client requests",
      // ... Anonymous access

      //
      // MSearch
      //
      // Anonymous access...
      "keywordSearch" : "Search for apps",
      // ... Anonymous access

      //
      // MTags
      //
      // Anonymous access...
      "getCategoryTags" : "Get the list of category tags",
      // ... Anonymous access
      
      //
      // MVisitors
      //
      "addOrEditVisitor"           : "Add and edit visitors",
      "whitelistVisitors"          : "Edit the whitelist",
      "deleteVisitor"              : "Delete visitors",
      "editProfile"                : "Edit user profile",
      "getVisitorListAndPGroups"   : "Retrieve list of visitors",
      
      //
      // MWhoAmI
      //
      // Anonymous access...
      "whoAmI" : "Identify the current user id and permissions",
      "getPublicUserProfile" : "Show user data publicly",
      // ... Anonymous access
      "getUserProfile" : "User data shown when a user edits their profile",

      //
      // MLikes
      //
      "likesPlusOne"     : "Like an app",

      //
      // MDbMgmt
      //
      "getDatabaseEntities" : "Retrieve all database entities of a given type",
      
      //
      // MPermissionGroup
      //
      "addOrEditPermissionGroup" : "Add/edit permission groups",
      "getGroupPermissions"      : "Retrieve permission groups",
      "deletePermissionGroup"    : "Delete a permission group",
      "getPermissionGroups"      : "Retrieve the list of permission groups",
      
      //
      // MChannel
      //
      "getChannelToken" : "Request server push",
      
      //
      // MSystem
      //
      "getMotd" : "Get the message of the day",
      "setMotd" : "Set the message of the day",
      "sendEmail" : "Send email to a user",

      // 
      // MGroup
      //
      addOrEditGroup   : "Create/Edit a group a user owns",
      getGroup         : "Get information about a group",
      getUserGroups    : "Get the groups a user owns",
      joinGroup        : "Request to join a group", 
      approveUsers     : "Approve a user for access to a group",
      approveAllUsers  : "Approve all waiting users for group access",
      removeGroupUsers : "Remove a user from group access",
      deleteGroup      : "Delete a group a user owns", 
      mgmtDeleteGroup  : "Delete any group (admin only)",
      groupSearch      : "Look for a group"
     
    },

    // Group types
    GroupTypes :
    {
      General     : "General",
      Educational : "Educational",
      K8          : "K-8",               // Subtype
      HS          : "High School",       // Subtype
      College     : "College/University" // Subtype
    },
    
    // Log messages. Comments above each are required parameters
    LogMessage :
    {
      // [ title ]
      "App submitted" : "Application submitted, being processed",
      
      // [ title (if available) ]
      "App incomplete" : "Application submitted but is incomplete",

      // [ title, imageNumber ]
      "Invalid image" : "An invalid image was uploaded",
      
      // [ title ]
      "Unknown app error" : "An unexpected error occurred while processing app",
      
      // [ title ]
      "App available" : "The application is now available",
      
      // [ title]
      "App removed" : "The application has been removed"
    }
  }
});
