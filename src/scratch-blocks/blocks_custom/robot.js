'use strict';

goog.provide('Blockly.Blocks.wedo');

goog.require('Blockly.Blocks');

goog.require('Blockly.Colours');

Blockly.Blocks['dropdown_robot_setcolor'] = {
  /**
   * Block for set color drop-down (used for shadow).
   * @this Blockly.Block
   */
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldColor([
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_mystery.svg',
              value: 'mystery', width: 48, height: 48, alt: 'Mystery'},
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_yellow.svg',
              value: 'yellow', width: 48, height: 48, alt: 'Yellow'},
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_orange.svg',
            value: 'orange', width: 48, height: 48, alt: 'Orange'},
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_coral.svg',
            value: 'coral', width: 48, height: 48, alt: 'Coral'},
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_magenta.svg',
            value: 'magenta', width: 48, height: 48, alt: 'Magenta'},
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_purple.svg',
            value: 'purple', width: 48, height: 48, alt: 'Purple'},
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_blue.svg',
            value: 'blue', width: 48, height: 48, alt: 'Blue'},
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_green.svg',
            value: 'green', width: 48, height: 48, alt: 'Green'},
          {src: Blockly.mainWorkspace.options.pathToMedia + 'icons/set-led_white.svg',
              value: 'white', width: 48, height: 48, alt: 'White'}
        ]), 'CHOICE');
    this.setOutput(true);
    this.setColour(Blockly.Colours.looks.primary,
      Blockly.Colours.looks.secondary,
      Blockly.Colours.looks.tertiary
    );
  }
};
