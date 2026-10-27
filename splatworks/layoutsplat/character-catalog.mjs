// Original CC0 character artwork, shared by templates and the character picker.
export const CHARACTER_POSES=[{id:'wave',name:'Greeting'},{id:'think',name:'Thinking'},{id:'explain',name:'Explaining'}];
export const COMIC_CHARACTERS=[
 {id:'maya',name:'Maya',kind:'people',description:'Curious maker in a teal jacket'},
 {id:'kai',name:'Kai',kind:'people',description:'Storyteller in a golden hoodie'},
 {id:'nia',name:'Nia',kind:'people',description:'Creative artist in coral'},
 {id:'sam',name:'Sam',kind:'people',description:'Thoughtful researcher with glasses'},
 {id:'pip',name:'Pip',kind:'animals',description:'A curious golden bird'},
 {id:'dot',name:'Dot',kind:'robots',description:'A friendly purple robot'},
 {id:'tess',name:'Tess',kind:'animals',description:'A patient green turtle'},
 {id:'orbit',name:'Orbit',kind:'animals',description:'A book-loving purple cat'},
];
export const characterPath=(id,pose='wave')=>`characters/${id}-${pose}.svg`;
export const CHARACTER_ASSET_PATHS=COMIC_CHARACTERS.flatMap(c=>CHARACTER_POSES.map(p=>characterPath(c.id,p.id)));
