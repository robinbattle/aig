/**
 * Copyright (c) 2013 Derrell Lipman
 *                    Vincent Zhang
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

/**
 * News gallery page 
 */
qx.Class.define("aiagallery.module.dgallery.news.News",
{
  type : "singleton",
  extend : aiagallery.main.AbstractModule,

  members :
  {
    /**
     * Create the module's finite state machine and graphical user interface.
     *
     * This function is called the first time a module is actually selected to
     * appear.  Creation of the module's actual FSM and GUI have been deferred
     * until they were actually needed (now) so we need to create them.
     *
     * @param module {aiagallery.main.Module}
     *   The module descriptor for the module.
     */
    initialAppear : function(module)
    {
      // Replace existing (temporary) finite state machine with the real one.
      aiagallery.module.dgallery.news.Fsm.getInstance().buildFsm(module);

      // Create the real gui.
      aiagallery.module.dgallery.news.Gui.getInstance().buildGui(module);
    }
  }
});
