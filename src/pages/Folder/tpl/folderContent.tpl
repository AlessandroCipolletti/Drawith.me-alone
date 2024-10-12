{{#each drawings}}
<div class="folder__drawing" data-local-id="{{this.localDbId}}">
  <img class="folder__drawing-preview" src="{{this.base64}}"></img>
  <div class="folder__drawing-select-icon"></div>
</div>
{{/each}}