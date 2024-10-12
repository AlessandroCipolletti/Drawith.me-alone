<div class="editor-tools__container">
  {{#each toolsData}}
    <div class="editor-tools__tool editor-tools__tool-{{this.name}} {{#if this.disabled}} disabled {{/if}}" data-tool="{{this.name}}"></div>
  {{/each}}
</div>

<div class="editor-tools__versions-container">
  {{#each toolsData}}
    {{#if this.versions}}
      <div class="editor-tools__versions editor-tools__versions-{{this.name}}">
        {{#each this.versions}}
          <div class="editor-tools__versions-button{{#if this.props.image}} editor-tools__versions-button-image{{/if}}" data-versionsIndex="{{@index}}" data-tool="{{../this.name}}"><p>{{this.name}}</p></div>
        {{/each}}
      </div>
    {{/if}}
  {{/each}}
</div>
