// Touch-only camera gestures. Coordinates use the canvas CSS drawing space,
// never device pixels or a particular level's projection constants.
(() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function localPoint(rect,width,height,x,y){return{x:(x-rect.left)*width/rect.width,y:(y-rect.top)*height/rect.height}}
  function boundedRect(rect,width,height){return{...rect,x:rect.w<=width?(width-rect.w)/2:clamp(rect.x,width-rect.w,0),y:rect.h<=height?(height-rect.h)/2:clamp(rect.y,height-rect.h,0)}}
  function anchoredRect(view,start,end,scale){return{...view,x:end.x-(start.x-view.x)*scale,y:end.y-(start.y-view.y)*scale,w:view.w*scale,h:view.h*scale,zoom:view.zoom*scale}}
  function gestures({getView,setView,onTap,onManual=()=>{},minZoom=.48,maxZoom=2.4,threshold=9}){
    const points=new Map();let base=null,blocked=false;
    const pair=()=>{const [a,b]=[...points.values()];return b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))}:a};
    function rebase(){base={point:pair(),view:{...getView()}}}
    return {
      down(id,p){points.set(id,p);if(points.size===1)blocked=false;else blocked=true;rebase()},
      move(id,p){if(!points.has(id))return;points.set(id,p);const now=pair();if(!base)return;
        if(points.size>=2){blocked=true;onManual();const scale=clamp(base.view.zoom*now.d/base.point.d,minZoom,maxZoom)/base.view.zoom;setView(anchoredRect(base.view,base.point,now,scale));}
        else if(blocked||Math.hypot(now.x-base.point.x,now.y-base.point.y)>threshold){blocked=true;onManual();setView({...base.view,x:base.view.x+now.x-base.point.x,y:base.view.y+now.y-base.point.y});}
      },
      up(id,p,cancel=false){if(!points.has(id))return;const tap=points.size===1&&!blocked&&!cancel&&Math.hypot(p.x-base.point.x,p.y-base.point.y)<=threshold;points.delete(id);if(points.size){blocked=true;rebase()}else base=null;if(tap)onTap(p)},
      cancel(){points.clear();base=null;blocked=true},
      has(id){return points.has(id)},
      get size(){return points.size}
    };
  }
  window.BATTLE_TOUCH={localPoint,boundedRect,anchoredRect,gestures};
})();
