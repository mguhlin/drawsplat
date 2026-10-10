const express=require('express');
function attachStaticSite(app,root) {
 if(!root)return;
 app.use((req,res,next)=>{
  if(!/^\/(?:$|index\.html$|site\.webmanifest$|(?:docs|assets|app|admin|vendor|solutions|games|pages|guides|legal|parents|community|languages|blog|studio|splatworks)\/)/.test(req.path))return res.status(404).end();
  next();
 },express.static(root,{dotfiles:'deny'}));
}
module.exports={attachStaticSite};
