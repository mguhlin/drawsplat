(function(){
  const note='Original sample item aligned to Texas science TEKS topics from TEA science standards resources.';
  function q(question,answer,wrong,type='multiple-choice',extra=''){
    return {question,answer,wrong,type,points:100,notes:extra||note};
  }
  window.DRAWSPLAT_SCIENCE_SAMPLE_SETS=[
    {
      id:'grade-3-science-teks',
      label:'Grade 3 Science TEKS - 20 questions',
      title:'Grade 3 Science TEKS Sample',
      timer:30,
      questions:[
        q('A student wears goggles while testing soil samples. Which science practice is the student showing?','Using safety equipment',['Making a food web','Predicting the weather','Classifying planets']),
        q('Which tool is best for measuring the temperature of water?','Thermometer',['Hand lens','Spring scale','Compass']),
        q('Which sentence is an observation instead of an inference?','The rock has a rough surface.',['The rock came from a volcano.','The rock is very old.','The rock will break tomorrow.']),
        q('A student says a plant grew taller after receiving sunlight and water. What is needed to support the claim?','Evidence from measurements',['A louder voice','A new pencil','A guess from a friend']),
        q('Which property best helps sort objects made of metal from objects made of wood?','Magnetism',['Flavor','Age','Sound level']),
        q('Ice melting into liquid water is an example of what kind of change?','Change in state',['Formation of a fossil','A planet orbiting','A seed sprouting']),
        q('Which form of energy lets you see a book page?','Light energy',['Thermal energy','Mechanical energy','Sound energy']),
        q('A drum makes a sound when it vibrates. What causes the sound?','Vibrations',['Gravity','Evaporation','Weathering']),
        q('A push or a pull can change an object\'s motion.','True',['False'],'true-false'),
        q('A faster moving ball usually has more mechanical energy than the same ball moving slowly.','True',['False'],'true-false'),
        q('Which model best shows the Moon moving around Earth?','The Moon orbiting Earth',['Earth orbiting the Moon','The Sun orbiting the Moon','Mars orbiting Earth']),
        q('Which planet is closest to the Sun?','Mercury',['Earth','Jupiter','Neptune']),
        q('Soil can form from weathered rock and decomposed plant and animal material.','True',['False'],'true-false'),
        q('Which event can rapidly change Earth\'s surface?','Earthquake',['Daily sunset','Plant germination','Animal migration']),
        q('Reusing a plastic bottle helps conserve natural resources.','True',['False'],'true-false'),
        q('A cactus has a waxy covering and stores water. Which environment do these traits help it survive in?','Desert',['Arctic tundra','Deep ocean','Rainforest canopy']),
        q('Which behavior helps some animals respond to colder seasons?','Hibernation',['Evaporation','Erosion','Condensation']),
        q('In a simple life cycle, what usually comes after a seed germinates?','Young plant',['Fossil','Adult butterfly','Full Moon']),
        q('Fossils can provide evidence of organisms that lived in past environments.','True',['False'],'true-false'),
        q('Which choice is a producer in an ecosystem?','Grass',['Rabbit','Hawk','Mushroom'])
      ]
    },
    {
      id:'grade-5-science-teks',
      label:'Grade 5 Science TEKS - 20 questions',
      title:'Grade 5 Science TEKS Sample',
      timer:30,
      questions:[
        q('Which property can be measured with a graduated cylinder?','Volume',['Magnetism','Texture','Color']),
        q('A substance that dissolves evenly in water forms what kind of mixture?','Solution',['Fossil','Orbit','Circuit']),
        q('When salt dissolves in water, the salt is still present in the solution.','True',['False'],'true-false'),
        q('Which evidence best shows that matter is conserved in a closed solution?','The total mass before and after mixing is the same.',['The color is brighter.','The cup feels colder.','The water level looks lower.']),
        q('In a flashlight, chemical energy in the battery changes mainly into what forms?','Electrical energy and light energy',['Sound energy and soil','Gravity and magnetism','Fossils and weather']),
        q('What is required for a simple electric circuit to light a bulb?','A closed path with an energy source',['A broken wire','Only a switch with no battery','A plastic cup']),
        q('Which material is usually a good conductor in a classroom circuit?','Copper wire',['Rubber band','Wooden stick','Paper towel']),
        q('Gravity pulls objects toward Earth.','True',['False'],'true-false'),
        q('Friction between a moving object and a surface usually does what?','Slows the object',['Creates sunlight','Turns it into a fossil','Makes it evaporate']),
        q('Which part of the water cycle happens when liquid water changes into water vapor?','Evaporation',['Precipitation','Runoff','Deposition']),
        q('Clouds can form when water vapor cools and condenses.','True',['False'],'true-false'),
        q('Which statement describes weather rather than climate?','It rained in Austin this afternoon.',['West Texas is usually dry.','A rainforest is warm and wet over many years.','Average winter temperatures are mild near the coast.']),
        q('Sedimentary rock can form when layers of sediment are compacted and cemented.','True',['False'],'true-false'),
        q('Which natural resource is considered nonrenewable on a human time scale?','Coal',['Sunlight','Wind','Flowing water']),
        q('Earth\'s rotation causes what daily pattern?','Day and night',['Seasons only','Ocean tides only','Fossil formation']),
        q('Which object is at the center of our solar system?','The Sun',['Earth','The Moon','Jupiter']),
        q('In a food web, arrows usually show what movement?','The flow of energy from one organism to another',['The age of organisms','The size of planets','The direction of wind only']),
        q('Which organism breaks down dead material and returns nutrients to soil?','Decomposer',['Planet','Conductor','Predator only']),
        q('Inherited traits are passed from parents to offspring.','True',['False'],'true-false'),
        q('A bird\'s beak shape can help it get food in its environment. What is this an example of?','Adaptation',['Evaporation','Condensation','Electric current'])
      ]
    },
    {
      id:'grade-10-biology-teks',
      label:'Grade 10 Biology TEKS - 20 questions',
      title:'Grade 10 Biology TEKS Sample',
      timer:45,
      questions:[
        q('Which molecule stores most hereditary information in cells?','DNA',['Glucose','Starch','Water']),
        q('What is the basic unit of structure and function in living things?','Cell',['Atom','Organ system','Ecosystem']),
        q('Which organelle is the main site of photosynthesis in plant cells?','Chloroplast',['Ribosome','Nucleus','Mitochondrion']),
        q('Which organelle releases usable energy from food during cellular respiration?','Mitochondrion',['Vacuole','Cell wall','Chloroplast']),
        q('Enzymes usually speed up chemical reactions by lowering activation energy.','True',['False'],'true-false'),
        q('What process copies DNA before a cell divides?','DNA replication',['Translation','Diffusion','Natural selection']),
        q('During transcription, information in DNA is used to make what molecule?','RNA',['Lipid','Starch','Cellulose']),
        q('Which process uses mRNA instructions to build a protein?','Translation',['Photosynthesis','Osmosis','Mitosis']),
        q('Mitosis produces daughter cells that are genetically identical to the parent cell.','True',['False'],'true-false'),
        q('Which process forms gametes and increases genetic variation?','Meiosis',['Binary fission','Mitosis','Fermentation only']),
        q('In a simple Punnett square, two heterozygous parents for a dominant trait usually produce what genotype ratio?','1 AA : 2 Aa : 1 aa',['4 AA : 0 Aa : 0 aa','0 AA : 4 Aa : 0 aa','1 AA : 1 Aa : 2 aa']),
        q('A mutation is a change in what?','DNA sequence',['Weather pattern','Food web direction','Population size only']),
        q('Which statement best describes homeostasis?','Maintaining stable internal conditions',['Changing DNA into RNA','Producing offspring with variation','Classifying organisms by fossils only']),
        q('Photosynthesis converts light energy into chemical energy stored in glucose.','True',['False'],'true-false'),
        q('Cellular respiration releases energy from glucose and uses oxygen in many organisms.','True',['False'],'true-false'),
        q('Which taxonomic level is most specific?','Species',['Kingdom','Phylum','Class']),
        q('Natural selection acts on which kind of variation?','Heritable variation that affects survival or reproduction',['Only learned behavior','Only temporary injuries','Only changes in weather']),
        q('Which evidence can support common ancestry among organisms?','Similar DNA sequences',['Different classroom tools','Identical weather conditions','A single food chain']),
        q('In an ecosystem, producers are important because they do what?','Convert sunlight or chemical energy into stored food energy',['Break down only rocks','Consume only top predators','Stop all energy flow']),
        q('The carbon cycle includes movement of carbon through organisms, the atmosphere, water, and geosphere.','True',['False'],'true-false')
      ]
    }
  ];
})();
