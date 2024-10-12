<div class="dashboard__container displayNone" style="height: calc(100% - {{marginTop}}px); top: {{marginTop}}px;">
  <svg version="1.1" class="dashboard__svg">
    <rect class="dashboard__zoom-label-rect" x="{{zoomRectCoord}}" y="{{zoomRectCoord}}" rx="{{zoomRectBorderRadius}}" ry="{{zoomRectBorderRadius}}" width="{{zoomRectWidth}}" height="{{zoomRectHeight}}"></rect>
    <text class="dashboard__zoom-label" x="{{zoomLabelX}}" y="{{zoomLabelY}}">100%</text>
  </svg>
  <a class="dashboard__showeditor button">{{labelToDraw}}</a>
  <div class="dashboard__spinner">
    <img class="dashboard__spinner-image" src="img/spinner.svg">
  </div>
</div>
