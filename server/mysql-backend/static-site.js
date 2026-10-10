const express=require('express');
function attachStaticSite(app,root) {
 if(!root)return;
 app.use((req,res,next)=>{
  res.removeHeader('X-Frame-Options');
  res.set('Permissions-Policy','camera=(self), microphone=(self), geolocation=(), payment=()');
  if(!/^\/(?:$|index\.html$|compliance\.config\.json$|site\.webmanifest$|(?:docs|assets|app|admin|vendor|solutions|games|pages|guides|legal|parents|community|languages|blog|studio|splatworks)\/)/.test(req.path))return res.status(404).end();
  next();
 },express.static(root,{dotfiles:'deny'}));
}
module.exports={attachStaticSite};
