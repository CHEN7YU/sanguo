// One coordinate transform for the painted map, grid, units and input.
(() => {
  // Tiger Gate now uses a true 16 x 24 orthographic board.  Each logical
  // tile occupies exactly 1/16 of the art width and 1/24 of its height, so
  // the background is never stretched to fake square cells.
  const projection={x:1/32,y:1/48,dx:1/16,dy:1/24};
  function hulaoView({width,height,zoom=1,panX=0,panY=0,focus={x:13,y:19},overview=false,compact=false}){
    const baseCell=Math.max(compact?48:40,Math.min(width/18,height/16));
    const cell=overview?Math.min(width*projection.dx,height*projection.dy)*.96:baseCell*zoom;
    const w=cell/projection.dx,h=cell/projection.dy;
    const preferredX=width*.62-(projection.x+focus.x*projection.dx)*w+panX;
    const preferredY=height*.63-(projection.y+focus.y*projection.dy)*h+panY;
    const x=w<=width?(width-w)/2:Math.max(width-w,Math.min(0,preferredX));
    const y=h<=height?(height-h)/2:Math.max(height-h,Math.min(0,preferredY));
    return{x,y,w,h,scale:cell/72,cell};
  }
  function hulaoTileAt(rect,sx,sy,cols=16,rows=24){
    const x=Math.floor(((sx-rect.x)/rect.w-projection.x)/projection.dx+.5);
    const y=Math.floor(((sy-rect.y)/rect.h-projection.y)/projection.dy+.5);
    return x>=0&&x<cols&&y>=0&&y<rows?{x,y}:null;
  }
  function hulaoTileCenter(rect,x,y){
    return{x:rect.x+(projection.x+x*projection.dx)*rect.w,y:rect.y+(projection.y+y*projection.dy)*rect.h};
  }
  function squareProjection(level){
    return level.viewProjection||{x:.035,y:.065,dx:.93/Math.max(1,level.width-1),dy:.87/Math.max(1,level.height-1)};
  }
  function squareView({width,height,level,zoom=1,panX=0,panY=0,focus,overview=false,compact=false}){
    const p=squareProjection(level),baseCell=Math.max(compact?46:40,Math.min(width/17,height/12));
    const cell=overview?Math.min(width*p.dx,height*p.dy)*.94:baseCell*zoom;
    const w=cell/p.dx,h=cell/p.dy,spot=focus||{x:level.width/2,y:level.height/2};
    const preferredX=width*.56-(p.x+spot.x*p.dx)*w+panX;
    const preferredY=height*.57-(p.y+spot.y*p.dy)*h+panY;
    return{x:w<=width?(width-w)/2:Math.max(width-w,Math.min(0,preferredX)),y:h<=height?(height-h)/2:Math.max(height-h,Math.min(0,preferredY)),w,h,scale:cell/72,cell};
  }
  function squareTileAt(rect,sx,sy,level){
    const p=squareProjection(level),y=Math.round(((sy-rect.y)/rect.h-p.y)/p.dy),shift=p.rowShift?.[y]||0,x=Math.round(((sx-rect.x)/rect.w-p.x-shift)/p.dx);
    return x>=0&&x<level.width&&y>=0&&y<level.height?{x,y}:null;
  }
  function squareTileCenter(rect,x,y,level){const p=squareProjection(level),shift=p.rowShift?.[Math.round(y)]||0;return{x:rect.x+(p.x+shift+x*p.dx)*rect.w,y:rect.y+(p.y+y*p.dy)*rect.h}}
  window.BATTLE_VIEW={hulaoView,hulaoTileAt,hulaoTileCenter,squareView,squareTileAt,squareTileCenter};
})();
