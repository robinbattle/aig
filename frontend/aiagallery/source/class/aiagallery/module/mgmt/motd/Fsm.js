/**
 * Copyright (c) 2012 Paul Geromini
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

/*
require(aiagallery.module.dgallery.appinfo.AppInfo)
 */

/**
 * Motd Finite State Machine
 */
qx.Class.define("aiagallery.module.mgmt.motd.Fsm",
{
  type : "singleton",
  extend : aiagallery.main.AbstractModuleFsm,

  members :
  {
    buildFsm : function(module)
    {
      var fsm = module.fsm;
      var state;
      var trans;

      // ------------------------------------------------------------ //
      // State: Idle
      // ------------------------------------------------------------ //

      /*
       * State: Idle
       *
       * Actions upon entry
       *   - if returning from RPC, display the result
       */

      state = new qx.util.fsm.State("State_Idle",
      {
        "context" : this,

        "onentry" : function(fsm, event)
        {
          // Did we just return from an RPC request?
          if (fsm.getPreviousState() == "State_AwaitRpcResult")
          {
            // Yup.  Display the result.  We need to get the request object
            var rpcRequest = this.popRpcRequest();

            // Call the standard result handler
            var gui = aiagallery.module.mgmt.motd.Gui.getInstance();
            gui.handleResponse(module, rpcRequest);

            // Dispose of the request
            if (rpcRequest.request)
            {
              rpcRequest.request.dispose();
              rpcRequest.request = null;
            }
          }
        },

        "events" :
        {
          // On the clicking of a button, execute is fired
          "execute" :
          {
            "saveBtn" : "Transition_Idle_to_AwaitRpcResult_via_saveBtn"
          },
          
          // When we get an appear event, retrieve the current motd if 
          // there is one
          "appear"    :
          {
            "main.canvas" : "Transition_Idle_to_AwaitRpcResult_via_appear"
          },

          // When we get a disappear event
          "disappear" :
          {
            //"main.canvas" : "Transition_Idle_to_Idle_via_disappear"
          }
        }
      });

      // Replace the initial Idle state with this one
      fsm.replaceState(state, true);


      /*
       * Transition: Idle to Idle
       *
       * Cause: "appear" on canvas
       *
       * Action:
       *  If this is the very first appear, retrieve the current if any motd. 
       */

      trans = new qx.util.fsm.Transition(
        "Transition_Idle_to_AwaitRpcResult_via_appear",
      {
        "nextState" : "State_AwaitRpcResult",

        "context" : this,

        "ontransition" : function(fsm, event)
        {
         // Get the current motd if there is one
         var request = 
             this.callRpc(fsm,
                          "aiagallery.features",
                          "getMotd",
                          []);
                          
          // When we get the result, we'll need to know what type of request
          // we made.
          request.setUserData("requestType", "getMotd");
        }
      });

      state.addTransition(trans);


      /*
       * Transition: Idle to Awaiting RPC Result
       *
       * Cause: "Save" button pressed
       *
       * Action:
       *  Save the content in the textarea in a new or existing motd
       */
        
      trans = new qx.util.fsm.Transition(
        "Transition_Idle_to_AwaitRpcResult_via_saveBtn",
      {
        "nextState" : "State_AwaitRpcResult",

        "context" : this,

        "ontransition" : function(fsm, event)
        {
         
          var        motdText; 
          
          // Get the motd text
          motdText = fsm.getObject("motdTextArea").getValue();
         
          // Update motd on db
          var request =
              this.callRpc(fsm,
                           "aiagallery.features",
                           "setMotd",
                           [motdText]);

          // When we get the result, we'll need to know what type of request
          // we made.
          request.setUserData("requestType", "setMotd");

        }
      });

      state.addTransition(trans);
    
      // ------------------------------------------------------------ //
      // State: AwaitRpcResult
      // ------------------------------------------------------------ //

      // Add the AwaitRpcResult state and all of its transitions
      this.addAwaitRpcResultState(module);
    }
  }
});
