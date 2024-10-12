<div class="editor-colorpicker__container">
  <div class="editor-colorpicker__input-container">
    <div class="editor-colorpicker__input"></div>
    <input type="color" />
  </div>
  <div class="editor-colorpicker__pipette-container">
    <div class="editor-colorpicker__pipette"></div>
  </div>
  <div class="editor-colorpicker__random-container">
    <div class="editor-colorpicker__random"></div>
  </div>
  <div class="editor-colorpicker__colors-container">
    {{#each colors}}
      <div class="editor-colorpicker__color" data-id="{{this.id}}" style="background-color: {{this.finalHex}}"></div>
    {{/each}}
  </div>
</div>

<div class="editor-colorpicker__params-container params-container">
  <div>
    <span>{{labels.brightness}}</span>
    <div class="horizontal-slider editor-colorpicker__brightness-slider">
      <div><span></span></div>
    </div>
  </div>
  <div>
    <span>{{labels.suggested}}</span>
    <div class="editor-colorpicker__suggested-container"></div>
  </div>
  <div class="editor-colorpicker__params-button editor-colorpicker__delete-button svg-icon-delete svg-icon-dark"></div>
</div>
