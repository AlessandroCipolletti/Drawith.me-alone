<div class="folder__share-popup">
  <div class="folder__share-popup-title">
    {{subtitleLabel}}
  </div>
  <div class="folder__share-popup-subtitle">
    <div>
      {{withoutBackgroundLabel}}
    </div>
    <div>
      {{withBackgroundLabel}}
    </div>
  </div>
  <div class="folder__share-popup-content">
    {{#each drawings}}
    <div class="folder__share-popup-line">
      <img class="folder__share-popup-image" src="{{this.t}}" />
      <img class="folder__share-popup-image" src="{{this.w}}" />
    </div>
    {{/each}}
  </div>
</div>