const config=require('./playwright.whiteboard.config');
module.exports={...config,testMatch:/imagesplat-(green-screen|remove-color).*\.spec\.js/,outputDir:'.tmp/imagesplat-audit-results'};
