"use client";

import { useState, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Example      { english: string; highlight: string; spanish: string; note?: string; }
interface GrammarTopic { id: string; label: string; icon: string; color: Color; title: string; structure: string; description: string; examples: Example[]; }
interface QuizQuestion { sentence: string; options: string[]; correct: string; topic: string; explanation: string; }
interface PhrasalVerb  { verb: string; group: string; spanish: string; example: string; }

type Color   = "indigo"|"emerald"|"amber"|"orange"|"purple"|"rose"|"sky"|"teal"|"lime"|"pink"|"yellow"|"violet";
type Section = "reference"|"quiz"|"phrasal";

// ── Color map ────────────────────────────────────────────────────────────────

const COLORS: Record<Color, { text: string; border: string; badge: string }> = {
  indigo:  { text:"text-indigo-400",  border:"border-indigo-500",  badge:"bg-indigo-900/60 text-indigo-300 border border-indigo-700"   },
  emerald: { text:"text-emerald-400", border:"border-emerald-500", badge:"bg-emerald-900/60 text-emerald-300 border border-emerald-700" },
  amber:   { text:"text-amber-400",   border:"border-amber-500",   badge:"bg-amber-900/60 text-amber-300 border border-amber-700"       },
  orange:  { text:"text-orange-400",  border:"border-orange-500",  badge:"bg-orange-900/60 text-orange-300 border border-orange-700"    },
  purple:  { text:"text-purple-400",  border:"border-purple-500",  badge:"bg-purple-900/60 text-purple-300 border border-purple-700"    },
  rose:    { text:"text-rose-400",    border:"border-rose-500",    badge:"bg-rose-900/60 text-rose-300 border border-rose-700"          },
  sky:     { text:"text-sky-400",     border:"border-sky-500",     badge:"bg-sky-900/60 text-sky-300 border border-sky-700"             },
  teal:    { text:"text-teal-400",    border:"border-teal-500",    badge:"bg-teal-900/60 text-teal-300 border border-teal-700"          },
  lime:    { text:"text-lime-400",    border:"border-lime-500",    badge:"bg-lime-900/60 text-lime-300 border border-lime-700"          },
  pink:    { text:"text-pink-400",    border:"border-pink-500",    badge:"bg-pink-900/60 text-pink-300 border border-pink-700"          },
  yellow:  { text:"text-yellow-400",  border:"border-yellow-500",  badge:"bg-yellow-900/60 text-yellow-300 border border-yellow-700"    },
  violet:  { text:"text-violet-400",  border:"border-violet-500",  badge:"bg-violet-900/60 text-violet-300 border border-violet-700"    },
};

// ── Grammar reference data ────────────────────────────────────────────────────

const TOPICS: GrammarTopic[] = [
  {
    id:"past-participle", label:"Past Participle", icon:"📌", color:"indigo",
    title:"Past Participle", structure:"have / has / had + verb³   |   be + verb³",
    description:"El participio pasado (3.ª forma verbal) se usa en tiempos perfectos y en voz pasiva. Muchos son irregulares: go→gone, write→written, break→broken.",
    examples:[
      { english:"She has written three novels.", highlight:"written", spanish:"Ella ha escrito tres novelas.", note:"Present perfect — logro sin fecha específica." },
      { english:"The window was broken by the storm.", highlight:"broken", spanish:"La ventana fue rota por la tormenta.", note:"Voz pasiva — el sujeto recibe la acción." },
      { english:"Have you ever eaten sushi?", highlight:"eaten", spanish:"¿Alguna vez has comido sushi?", note:"Pregunta de experiencia con 'ever'." },
      { english:"By the time we arrived, the movie had already started.", highlight:"started", spanish:"Para cuando llegamos, la película ya había empezado.", note:"Past perfect — acción anterior a otra en el pasado." },
      { english:"The report has been reviewed by the manager.", highlight:"reviewed", spanish:"El informe ha sido revisado por el gerente.", note:"Present perfect pasivo." },
    ],
  },
  {
    id:"present-continuous", label:"Pres. Continuous", icon:"🔄", color:"emerald",
    title:"Present Continuous", structure:"am / is / are + verb-ing",
    description:"El presente continuo describe acciones en progreso ahora mismo, situaciones temporales y planes futuros ya acordados.",
    examples:[
      { english:"She is reading a novel right now.", highlight:"is reading", spanish:"Ella está leyendo una novela ahora mismo.", note:"Acción en progreso en este momento." },
      { english:"They are playing football in the park.", highlight:"are playing", spanish:"Ellos están jugando fútbol en el parque.", note:"Actividad que ocurre mientras se habla." },
      { english:"I am studying English every evening this month.", highlight:"am studying", spanish:"Estoy estudiando inglés todas las noches este mes.", note:"Situación temporal." },
      { english:"He is cooking a special dinner for the family tonight.", highlight:"is cooking", spanish:"Él está cocinando una cena especial esta noche.", note:"Plan concreto para el futuro cercano." },
      { english:"We are traveling to New York next week.", highlight:"are traveling", spanish:"Viajamos a Nueva York la próxima semana.", note:"Futuro acordado — ya hay reserva o plan definido." },
    ],
  },
  {
    id:"simple-past", label:"Simple Past", icon:"⏪", color:"amber",
    title:"Simple Past", structure:"subject + verb² (past form)",
    description:"El Simple Past describe acciones completadas en un momento específico del pasado. Regulares añaden -ed; irregulares tienen su propia forma: go→went, buy→bought.",
    examples:[
      { english:"She visited Paris last summer.", highlight:"visited", spanish:"Ella visitó París el verano pasado.", note:"Verbo regular: visit→visited." },
      { english:"He didn't go to the party.", highlight:"didn't go", spanish:"Él no fue a la fiesta.", note:"Negación con didn't + base form." },
      { english:"They bought a new car yesterday.", highlight:"bought", spanish:"Ellos compraron un carro nuevo ayer.", note:"Verbo irregular: buy→bought." },
      { english:"Did you see that movie?", highlight:"Did", spanish:"¿Viste esa película?", note:"Pregunta con did + base form." },
      { english:"We lived in Mexico for five years.", highlight:"lived", spanish:"Vivimos en México durante cinco años.", note:"Período de tiempo ya terminado." },
    ],
  },
  {
    id:"past-continuous", label:"Past Continuous", icon:"⏳", color:"orange",
    title:"Past Continuous", structure:"was / were + verb-ing",
    description:"Describe una acción en progreso en un momento del pasado. Con Simple Past indica una acción que fue interrumpida.",
    examples:[
      { english:"I was reading when you called.", highlight:"was reading", spanish:"Estaba leyendo cuando llamaste.", note:"Acción interrumpida por otra." },
      { english:"They were playing football at 5 pm.", highlight:"were playing", spanish:"Estaban jugando fútbol a las 5 pm.", note:"Acción en progreso en un momento específico." },
      { english:"She was cooking while he was cleaning.", highlight:"was cooking", spanish:"Ella cocinaba mientras él limpiaba.", note:"Dos acciones paralelas en el pasado." },
      { english:"It was raining all morning.", highlight:"was raining", spanish:"Estuvo lloviendo toda la mañana.", note:"Acción continua durante un período pasado." },
      { english:"Were you sleeping when I arrived?", highlight:"Were you sleeping", spanish:"¿Estabas durmiendo cuando llegué?", note:"Pregunta sobre actividad en progreso." },
    ],
  },
  {
    id:"present-perfect", label:"Pres. Perfect", icon:"✅", color:"purple",
    title:"Present Perfect", structure:"have / has + past participle",
    description:"Conecta el pasado con el presente. Para experiencias, acciones recientes con resultado presente y situaciones que comenzaron antes y continúan.",
    examples:[
      { english:"I have visited Japan twice.", highlight:"have visited", spanish:"He visitado Japón dos veces.", note:"Experiencia de vida — sin fecha específica." },
      { english:"She has just finished her homework.", highlight:"has just finished", spanish:"Ella acaba de terminar su tarea.", note:"Acción muy reciente — just." },
      { english:"Have you ever tried sushi?", highlight:"Have you ever tried", spanish:"¿Alguna vez has probado sushi?", note:"Pregunta de experiencia — ever." },
      { english:"He hasn't called me yet.", highlight:"hasn't called", spanish:"Él no me ha llamado todavía.", note:"Negación con yet — acción esperada que no ocurrió." },
      { english:"They have lived here since 2010.", highlight:"have lived", spanish:"Ellos han vivido aquí desde 2010.", note:"Situación que continúa hasta el presente — since." },
    ],
  },
  {
    id:"past-perfect", label:"Past Perfect", icon:"⏮", color:"rose",
    title:"Past Perfect", structure:"had + past participle",
    description:"Describe una acción anterior a otra acción en el pasado. Es el 'pasado del pasado' y establece una secuencia clara de eventos.",
    examples:[
      { english:"By the time I arrived, the movie had already started.", highlight:"had already started", spanish:"Para cuando llegué, la película ya había empezado.", note:"Acción anterior a otra acción pasada." },
      { english:"She had never seen snow before that day.", highlight:"had never seen", spanish:"Ella nunca había visto nieve antes de ese día.", note:"Experiencia previa a un momento del pasado." },
      { english:"He was tired because he had worked all night.", highlight:"had worked", spanish:"Estaba cansado porque había trabajado toda la noche.", note:"Causa de una situación pasada." },
      { english:"They had already eaten when we arrived.", highlight:"had already eaten", spanish:"Ya habían comido cuando llegamos.", note:"Secuencia de eventos — already enfatiza el orden." },
      { english:"I realized I had forgotten my keys.", highlight:"had forgotten", spanish:"Me di cuenta de que había olvidado mis llaves.", note:"Descubrimiento de algo ocurrido antes." },
    ],
  },
  {
    id:"future", label:"Future", icon:"🔮", color:"sky",
    title:"Future: will vs going to", structure:"will + base  |  am/is/are going to + base",
    description:"Will: decisiones espontáneas, predicciones y promesas. Going to: planes ya decididos e intenciones. Con evidencia visible, going to es la opción natural.",
    examples:[
      { english:"I will help you with that.", highlight:"will help", spanish:"Te ayudaré con eso.", note:"Decisión espontánea o promesa — will." },
      { english:"She is going to study medicine.", highlight:"is going to study", spanish:"Ella va a estudiar medicina.", note:"Plan ya decidido — going to." },
      { english:"It will rain tomorrow, according to the forecast.", highlight:"will rain", spanish:"Lloverá mañana, según el pronóstico.", note:"Predicción basada en opinión — will." },
      { english:"Look at those clouds — it is going to rain!", highlight:"is going to rain", spanish:"¡Mira esas nubes — va a llover!", note:"Predicción basada en evidencia visible — going to." },
      { english:"Will you open the window, please?", highlight:"Will you open", spanish:"¿Podrías abrir la ventana, por favor?", note:"Petición educada — will." },
    ],
  },
  {
    id:"modals", label:"Modal Verbs", icon:"🎛️", color:"teal",
    title:"Modal Verbs", structure:"modal + base verb (sin to)",
    description:"Los modales expresan posibilidad, habilidad, obligación, permiso o consejo. No se conjugan ni añaden -s. Principales: can, could, should, must, may, might, would.",
    examples:[
      { english:"You should study more for the exam.", highlight:"should study", spanish:"Deberías estudiar más para el examen.", note:"Consejo — should." },
      { english:"She can speak three languages.", highlight:"can speak", spanish:"Ella puede hablar tres idiomas.", note:"Habilidad — can." },
      { english:"You must wear a seatbelt.", highlight:"must wear", spanish:"Debes usar cinturón de seguridad.", note:"Obligación fuerte — must." },
      { english:"It might snow tonight.", highlight:"might snow", spanish:"Podría nevar esta noche.", note:"Posibilidad débil — might." },
      { english:"Could I use your phone?", highlight:"Could I use", spanish:"¿Podría usar tu teléfono?", note:"Permiso educado — could." },
    ],
  },
  {
    id:"passive", label:"Passive Voice", icon:"🔃", color:"lime",
    title:"Passive Voice", structure:"be (conjugado) + past participle",
    description:"Enfoca la acción en el objeto que la recibe, no en quien la realiza. El agente se omite o se introduce con 'by'. Funciona en cualquier tiempo verbal.",
    examples:[
      { english:"The book was written by Hemingway.", highlight:"was written", spanish:"El libro fue escrito por Hemingway.", note:"Simple past pasivo — agente introducido con by." },
      { english:"English is spoken in many countries.", highlight:"is spoken", spanish:"El inglés se habla en muchos países.", note:"Simple present pasivo — agente general omitido." },
      { english:"The package will be delivered tomorrow.", highlight:"will be delivered", spanish:"El paquete será entregado mañana.", note:"Future pasivo." },
      { english:"The road has been closed due to construction.", highlight:"has been closed", spanish:"La carretera ha sido cerrada por construcción.", note:"Present perfect pasivo." },
      { english:"Mistakes were made.", highlight:"were made", spanish:"Se cometieron errores.", note:"Agente omitido intencionalmente." },
    ],
  },
  {
    id:"conditionals", label:"Conditionals", icon:"🔀", color:"pink",
    title:"Conditionals", structure:"If + condition, result",
    description:"Zero: verdades generales. First: situaciones posibles. Second: hipotéticas en el presente. Third: hipotéticas en el pasado.",
    examples:[
      { english:"If you heat water to 100°C, it boils.", highlight:"heat", spanish:"Si calientas agua a 100°C, hierve.", note:"Zero conditional — verdad universal o científica." },
      { english:"If it rains tomorrow, we will cancel the trip.", highlight:"will cancel", spanish:"Si llueve mañana, cancelaremos el viaje.", note:"1st conditional — situación posible y real." },
      { english:"If I had more money, I would travel the world.", highlight:"would travel", spanish:"Si tuviera más dinero, viajaría por el mundo.", note:"2nd conditional — hipotético en el presente." },
      { english:"If she had studied harder, she would have passed.", highlight:"would have passed", spanish:"Si hubiera estudiado más, habría pasado.", note:"3rd conditional — hipotético en el pasado." },
      { english:"If I were you, I would apologize.", highlight:"were", spanish:"Si fuera tú, me disculparía.", note:"2nd conditional — 'were' para todos los sujetos en consejos." },
    ],
  },
  {
    id:"gerund-infinitive", label:"Gerund / Inf.", icon:"🔤", color:"yellow",
    title:"Gerund vs Infinitive", structure:"verb + -ing  |  to + base verb",
    description:"Enjoy, avoid, keep → gerundio. Want, decide, plan → infinitivo. Stop cambia de significado: stop talking (dejar de) vs stop to talk (detenerse para).",
    examples:[
      { english:"She enjoys reading books every night.", highlight:"reading", spanish:"A ella le gusta leer libros cada noche.", note:"Enjoy siempre + gerundio." },
      { english:"He decided to leave the company.", highlight:"to leave", spanish:"Él decidió dejar la empresa.", note:"Decide siempre + infinitivo." },
      { english:"They stopped talking when I entered.", highlight:"talking", spanish:"Dejaron de hablar cuando entré.", note:"Stop + gerundio = dejar de hacer algo." },
      { english:"She stopped to talk to me.", highlight:"to talk", spanish:"Ella se detuvo para hablarme.", note:"Stop + infinitivo = detenerse con un propósito." },
      { english:"I avoid eating fast food.", highlight:"eating", spanish:"Evito comer comida rápida.", note:"Avoid siempre + gerundio." },
    ],
  },
  {
    id:"reported-speech", label:"Reported Speech", icon:"💬", color:"violet",
    title:"Reported Speech", structure:"said (that) + retroceso de tiempo verbal",
    description:"Los tiempos retroceden: present→past, past→past perfect, will→would. Los pronombres y expresiones de tiempo también cambian.",
    examples:[
      { english:"She said she loved pizza.", highlight:"loved", spanish:"Dijo que le encantaba la pizza.", note:'Direct: "I love pizza." → Present simple → Past simple.' },
      { english:"They said they were working.", highlight:"were working", spanish:"Dijeron que estaban trabajando.", note:'Direct: "We are working." → Past continuous.' },
      { english:"He said he would call me.", highlight:"would call", spanish:"Dijo que me llamaría.", note:'Direct: "I will call you." → Will → Would.' },
      { english:"She asked if I had eaten.", highlight:"had eaten", spanish:"Preguntó si había comido.", note:'Direct: "Have you eaten?" → Present perfect → Past perfect.' },
      { english:"He told me not to touch that.", highlight:"not to touch", spanish:"Me dijo que no tocara eso.", note:'Direct: "Don\'t touch that!" → Imperativo negativo.' },
    ],
  },
];

// ── Quiz data (4 per topic = 48 questions) ────────────────────────────────────

const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Past Participle
  { sentence:"She has ___ three novels.", options:["written","wrote","writes","writing"], correct:"written", topic:"Past Participle", explanation:"Present perfect usa have/has + participio pasado. Write → written (irregular)." },
  { sentence:"The report has been ___ by the manager.", options:["reviewing","reviews","reviewed","review"], correct:"reviewed", topic:"Past Participle", explanation:"Voz pasiva en present perfect: has been + participio pasado." },
  { sentence:"By the time I arrived, the movie had already ___.", options:["start","starts","starting","started"], correct:"started", topic:"Past Participle", explanation:"Past perfect: had + participio pasado. Start → started (regular)." },
  { sentence:"Have you ever ___ sushi?", options:["eat","ate","eating","tried"], correct:"tried", topic:"Past Participle", explanation:"Present perfect + ever → participio pasado. Try → tried." },

  // Present Continuous
  { sentence:"She ___ a novel right now.", options:["reads","read","was reading","is reading"], correct:"is reading", topic:"Present Continuous", explanation:"Acción en progreso ahora: is/am/are + verb-ing." },
  { sentence:"___ you watching TV at the moment?", options:["Do","Did","Are","Have"], correct:"Are", topic:"Present Continuous", explanation:"Pregunta en present continuous: Are/Am/Is + subject + verb-ing." },
  { sentence:"Look! It ___.", options:["rains","rained","has rained","is raining"], correct:"is raining", topic:"Present Continuous", explanation:"'Look!' indica evidencia visible ahora → present continuous." },
  { sentence:"We ___ to New York next week.", options:["traveled","travel","were traveling","are traveling"], correct:"are traveling", topic:"Present Continuous", explanation:"Plan futuro ya acordado → present continuous." },

  // Simple Past
  { sentence:"She ___ Paris last summer.", options:["visits","has visited","visited","was visiting"], correct:"visited", topic:"Simple Past", explanation:"'Last summer' = tiempo específico terminado → simple past." },
  { sentence:"He ___ to the party.", options:["wasn't going","doesn't go","hadn't gone","didn't go"], correct:"didn't go", topic:"Simple Past", explanation:"Negación en simple past: didn't + base form." },
  { sentence:"___ you see that movie?", options:["Have","Were","Do","Did"], correct:"Did", topic:"Simple Past", explanation:"Pregunta en simple past: Did + subject + base form." },
  { sentence:"They ___ a new car yesterday.", options:["are buying","have bought","buy","bought"], correct:"bought", topic:"Simple Past", explanation:"'Yesterday' = tiempo específico → simple past. Buy → bought (irregular)." },

  // Past Continuous
  { sentence:"I ___ when you called.", options:["read","have read","was reading","am reading"], correct:"was reading", topic:"Past Continuous", explanation:"Acción en progreso interrumpida por otra → past continuous." },
  { sentence:"She ___ while he was cleaning.", options:["cooked","has cooked","cooks","was cooking"], correct:"was cooking", topic:"Past Continuous", explanation:"Dos acciones paralelas en el pasado → past continuous + past continuous." },
  { sentence:"___ you sleeping when I arrived?", options:["Are","Did","Have","Were"], correct:"Were", topic:"Past Continuous", explanation:"Pregunta en past continuous: Were/Was + subject + verb-ing." },
  { sentence:"It ___ all morning.", options:["rains","has rained","rained","was raining"], correct:"was raining", topic:"Past Continuous", explanation:"Acción continua durante un período pasado → past continuous." },

  // Present Perfect
  { sentence:"I ___ Japan twice.", options:["visited","was visiting","am visiting","have visited"], correct:"have visited", topic:"Present Perfect", explanation:"Experiencia de vida sin fecha específica → present perfect." },
  { sentence:"Have you ever ___ sushi?", options:["try","trying","tried","tries"], correct:"tried", topic:"Present Perfect", explanation:"Present perfect + ever → participio pasado. Try → tried." },
  { sentence:"She ___ her homework yet.", options:["wasn't finishing","didn't finish","doesn't finish","hasn't finished"], correct:"hasn't finished", topic:"Present Perfect", explanation:"'Yet' en negaciones → present perfect: hasn't + participio." },
  { sentence:"They ___ here since 2010.", options:["are living","were living","lived","have lived"], correct:"have lived", topic:"Present Perfect", explanation:"'Since' con situación que continúa → present perfect." },

  // Past Perfect
  { sentence:"By the time I arrived, the movie ___.", options:["already started","has already started","was starting","had already started"], correct:"had already started", topic:"Past Perfect", explanation:"Acción anterior a otra en el pasado → past perfect: had + participio." },
  { sentence:"She ___ snow before that day.", options:["never saw","has never seen","never sees","had never seen"], correct:"had never seen", topic:"Past Perfect", explanation:"Experiencia previa a un momento pasado → past perfect." },
  { sentence:"He was tired because he ___ all night.", options:["has worked","worked","was working","had worked"], correct:"had worked", topic:"Past Perfect", explanation:"Causa de una situación pasada anterior → past perfect." },
  { sentence:"I realized I ___ my keys.", options:["was forgetting","have forgotten","forgot","had forgotten"], correct:"had forgotten", topic:"Past Perfect", explanation:"Descubrimiento de algo ocurrido antes → past perfect." },

  // Future
  { sentence:"I ___ you with that. (decisión espontánea)", options:["am helping","am going to help","helped","will help"], correct:"will help", topic:"Future", explanation:"Decisión tomada en el momento de hablar → will." },
  { sentence:"She ___ medicine. (plan decidido)", options:["studies","studied","will study","is going to study"], correct:"is going to study", topic:"Future", explanation:"Plan ya decidido antes de hablar → going to." },
  { sentence:"Look at those clouds — it ___!", options:["rained","will rain","rains","is going to rain"], correct:"is going to rain", topic:"Future", explanation:"Predicción con evidencia visible → going to." },
  { sentence:"According to the forecast, it ___ rain tomorrow.", options:["is going to","rained","rains","will"], correct:"will", topic:"Future", explanation:"Predicción basada en información (sin evidencia directa) → will." },

  // Modal Verbs
  { sentence:"You ___ study more for the exam. (consejo)", options:["must","might","can","should"], correct:"should", topic:"Modal Verbs", explanation:"Consejo → should. Must implica obligación más fuerte." },
  { sentence:"She ___ speak three languages. (habilidad)", options:["should","must","might","can"], correct:"can", topic:"Modal Verbs", explanation:"Habilidad → can." },
  { sentence:"You ___ wear a seatbelt. (obligación fuerte)", options:["should","might","could","must"], correct:"must", topic:"Modal Verbs", explanation:"Obligación fuerte o regla → must." },
  { sentence:"It ___ snow tonight. (posibilidad débil)", options:["must","can","should","might"], correct:"might", topic:"Modal Verbs", explanation:"Posibilidad débil o incierta → might." },

  // Passive Voice
  { sentence:"The book ___ by Hemingway.", options:["writes","has written","written","was written"], correct:"was written", topic:"Passive Voice", explanation:"Simple past pasivo: was/were + participio pasado." },
  { sentence:"English ___ in many countries.", options:["spoke","has spoken","speaks","is spoken"], correct:"is spoken", topic:"Passive Voice", explanation:"Simple present pasivo: is/are + participio pasado." },
  { sentence:"The package ___ tomorrow.", options:["is delivered","delivers","was delivered","will be delivered"], correct:"will be delivered", topic:"Passive Voice", explanation:"Future pasivo: will be + participio pasado." },
  { sentence:"Mistakes ___.", options:["made","make","have made","were made"], correct:"were made", topic:"Passive Voice", explanation:"Simple past pasivo con agente omitido: were + participio pasado." },

  // Conditionals
  { sentence:"If you heat water to 100°C, it ___.", options:["will boil","would boil","boiled","boils"], correct:"boils", topic:"Conditionals", explanation:"Zero conditional (verdad universal): if + present simple, present simple." },
  { sentence:"If it ___ tomorrow, we will cancel the trip.", options:["will rain","would rain","rained","rains"], correct:"rains", topic:"Conditionals", explanation:"1st conditional: if + present simple, will + base form." },
  { sentence:"If I had more money, I ___ travel the world.", options:["will","travel","traveled","would"], correct:"would", topic:"Conditionals", explanation:"2nd conditional (hipotético): if + past simple, would + base form." },
  { sentence:"If she had studied harder, she ___ passed.", options:["will have","had","would have","could"], correct:"would have", topic:"Conditionals", explanation:"3rd conditional (pasado hipotético): if + past perfect, would have + participio." },

  // Gerund vs Infinitive
  { sentence:"She enjoys ___ books every night.", options:["to read","read","reads","reading"], correct:"reading", topic:"Gerund vs Infinitive", explanation:"Enjoy siempre va seguido de gerundio (-ing)." },
  { sentence:"He decided ___ the company.", options:["leaving","leave","left","to leave"], correct:"to leave", topic:"Gerund vs Infinitive", explanation:"Decide siempre va seguido de infinitivo (to + base)." },
  { sentence:"They stopped ___ when I entered. (dejaron de hablar)", options:["to talk","talk","talked","talking"], correct:"talking", topic:"Gerund vs Infinitive", explanation:"Stop + gerundio = dejar de hacer algo." },
  { sentence:"I avoid ___ fast food.", options:["to eat","ate","eat","eating"], correct:"eating", topic:"Gerund vs Infinitive", explanation:"Avoid siempre va seguido de gerundio (-ing)." },

  // Reported Speech
  { sentence:'She said she ___ pizza. (Direct: "I love pizza.")', options:["loves","had loved","was loving","loved"], correct:"loved", topic:"Reported Speech", explanation:"Present simple retrocede a past simple en reported speech." },
  { sentence:'They said they ___ working. (Direct: "We are working.")', options:["are","have been","had been","were"], correct:"were", topic:"Reported Speech", explanation:"Present continuous → past continuous en reported speech." },
  { sentence:'He said he ___ call me. (Direct: "I will call you.")', options:["will","could","should","would"], correct:"would", topic:"Reported Speech", explanation:"Will → would en reported speech." },
  { sentence:'She asked if I ___. (Direct: "Have you eaten?")', options:["have eaten","was eating","ate","had eaten"], correct:"had eaten", topic:"Reported Speech", explanation:"Present perfect → past perfect en reported speech." },
];

// ── Phrasal Verbs data (~50) ──────────────────────────────────────────────────

const PHRASAL_VERBS: PhrasalVerb[] = [
  // GET
  { verb:"get up",       group:"GET",   spanish:"levantarse",           example:"I get up at 7 every morning." },
  { verb:"get over",     group:"GET",   spanish:"superar",              example:"It took weeks to get over the breakup." },
  { verb:"get along",    group:"GET",   spanish:"llevarse bien",        example:"She gets along with everyone at work." },
  { verb:"get back",     group:"GET",   spanish:"regresar",             example:"When did you get back from vacation?" },
  { verb:"get rid of",   group:"GET",   spanish:"deshacerse de",        example:"I need to get rid of these old clothes." },
  { verb:"get through",  group:"GET",   spanish:"superar / terminar",   example:"I finally got through all my emails." },
  { verb:"get away",     group:"GET",   spanish:"escaparse",            example:"We finally got away for the weekend." },
  { verb:"get on",       group:"GET",   spanish:"subirse / continuar",  example:"Get on the bus — it's about to leave." },
  // TAKE
  { verb:"take off",     group:"TAKE",  spanish:"despegar / quitarse",  example:"The plane takes off at noon." },
  { verb:"take on",      group:"TAKE",  spanish:"asumir / contratar",   example:"She took on too many responsibilities." },
  { verb:"take out",     group:"TAKE",  spanish:"sacar / invitar",      example:"He took her out for dinner." },
  { verb:"take up",      group:"TAKE",  spanish:"empezar (hobby) / ocupar", example:"I took up yoga last year." },
  { verb:"take over",    group:"TAKE",  spanish:"hacerse cargo",        example:"She took over the project." },
  { verb:"take back",    group:"TAKE",  spanish:"devolver",             example:"Can I take this shirt back to the store?" },
  // COME
  { verb:"come up with", group:"COME",  spanish:"ocurrírsele / idear",  example:"She came up with a brilliant idea." },
  { verb:"come across",  group:"COME",  spanish:"encontrarse con",      example:"I came across an old photo." },
  { verb:"come back",    group:"COME",  spanish:"volver",               example:"Come back soon!" },
  { verb:"come out",     group:"COME",  spanish:"salir / publicarse",   example:"The new album comes out on Friday." },
  { verb:"come up",      group:"COME",  spanish:"surgir",               example:"Something came up at work." },
  // GO
  { verb:"go on",        group:"GO",    spanish:"continuar",            example:"Please go on with your story." },
  { verb:"go out",       group:"GO",    spanish:"salir",                example:"Are you going out tonight?" },
  { verb:"go through",   group:"GO",    spanish:"pasar por / revisar",  example:"She went through a very difficult time." },
  { verb:"go over",      group:"GO",    spanish:"revisar",              example:"Let's go over the plan once more." },
  { verb:"go ahead",     group:"GO",    spanish:"adelante",             example:"Go ahead, I'm listening." },
  { verb:"go back",      group:"GO",    spanish:"regresar",             example:"I want to go back to Spain someday." },
  // MAKE
  { verb:"make up",      group:"MAKE",  spanish:"inventar / reconciliarse", example:"Don't make up excuses — just tell the truth." },
  { verb:"make out",     group:"MAKE",  spanish:"entender / distinguir", example:"I can't make out what he's saying." },
  { verb:"make up for",  group:"MAKE",  spanish:"compensar",            example:"I'll make up for the time I lost." },
  { verb:"make do with", group:"MAKE",  spanish:"arreglárselas con",    example:"We had to make do with what we had." },
  // LOOK
  { verb:"look up",      group:"LOOK",  spanish:"buscar (información)", example:"Look it up in the dictionary." },
  { verb:"look after",   group:"LOOK",  spanish:"cuidar",               example:"Can you look after my dog this weekend?" },
  { verb:"look for",     group:"LOOK",  spanish:"buscar",               example:"I'm looking for my keys." },
  { verb:"look into",    group:"LOOK",  spanish:"investigar",           example:"We'll look into the problem." },
  { verb:"look out",     group:"LOOK",  spanish:"tener cuidado",        example:"Look out! There's a car coming!" },
  { verb:"look forward to", group:"LOOK", spanish:"tener ganas de",     example:"I'm looking forward to the trip." },
  // PUT
  { verb:"put off",      group:"PUT",   spanish:"posponer",             example:"Don't put off what you can do today." },
  { verb:"put on",       group:"PUT",   spanish:"ponerse / encender",   example:"Put on your jacket — it's cold." },
  { verb:"put up with",  group:"PUT",   spanish:"aguantar / tolerar",   example:"I can't put up with this noise anymore." },
  { verb:"put away",     group:"PUT",   spanish:"guardar",              example:"Put away your toys when you're done." },
  { verb:"put out",      group:"PUT",   spanish:"apagar",               example:"Put out the fire before leaving." },
  // TURN
  { verb:"turn up",      group:"TURN",  spanish:"aparecer / subir volumen", example:"He always turns up late." },
  { verb:"turn down",    group:"TURN",  spanish:"rechazar / bajar volumen", example:"She turned down the job offer." },
  { verb:"turn on",      group:"TURN",  spanish:"encender",             example:"Turn on the lights, please." },
  { verb:"turn off",     group:"TURN",  spanish:"apagar",               example:"Turn off the TV when you leave." },
  { verb:"turn out",     group:"TURN",  spanish:"resultar",             example:"It turned out to be a great day." },
  // GIVE / RUN / BREAK / OTHER
  { verb:"give up",      group:"GIVE",  spanish:"rendirse",             example:"Never give up on your dreams." },
  { verb:"give away",    group:"GIVE",  spanish:"regalar / revelar",    example:"He gave away the ending of the movie." },
  { verb:"give in",      group:"GIVE",  spanish:"ceder",                example:"Don't give in to pressure." },
  { verb:"run into",     group:"RUN",   spanish:"encontrarse con",      example:"I ran into my old teacher at the store." },
  { verb:"run out of",   group:"RUN",   spanish:"quedarse sin",         example:"We ran out of milk." },
  { verb:"break up",     group:"BREAK", spanish:"terminar una relación / separarse", example:"They broke up after three years." },
  { verb:"break down",   group:"BREAK", spanish:"averiarse / derrumbarse", example:"My car broke down on the highway." },
  { verb:"find out",     group:"FIND",  spanish:"descubrir / enterarse", example:"How did you find out about this?" },
  { verb:"figure out",   group:"FIGURE",spanish:"entender / resolver",  example:"I finally figured out how to fix it." },
  { verb:"work out",     group:"WORK",  spanish:"ejercitarse / resolverse", example:"Everything will work out in the end." },
  { verb:"show up",      group:"SHOW",  spanish:"aparecer / presentarse", example:"He didn't show up to the meeting." },
  { verb:"set up",       group:"SET",   spanish:"montar / organizar",   example:"She set up her own business at 25." },
  { verb:"pick up",      group:"PICK",  spanish:"recoger / aprender",   example:"Can you pick up the kids after school?" },
  { verb:"carry on",     group:"CARRY", spanish:"continuar",            example:"Carry on — don't let me interrupt you." },
  { verb:"call off",     group:"CALL",  spanish:"cancelar",             example:"They called off the wedding." },
];

const PHRASAL_GROUPS = ["ALL", ...Array.from(new Set(PHRASAL_VERBS.map((p) => p.group))).sort()];

// ── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function highlightSentence(sentence: string, highlight: string) {
  const idx = sentence.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <span>{sentence}</span>;
  return (
    <>
      {sentence.slice(0, idx)}
      <span className="font-bold text-white underline decoration-dotted underline-offset-2">
        {sentence.slice(idx, idx + highlight.length)}
      </span>
      {sentence.slice(idx + highlight.length)}
    </>
  );
}

function renderSentenceWithBlank(sentence: string) {
  const parts = sentence.split("___");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="inline-block bg-slate-600 rounded px-3 mx-0.5 text-slate-400">
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </span>
      )}
    </span>
  ));
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

// ── Reference components ──────────────────────────────────────────────────────

function ExampleCard({ ex, color, index }: { ex: Example; color: Color; index: number }) {
  const c = COLORS[color];
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <span className={`text-xs font-bold mt-0.5 w-5 shrink-0 ${c.text}`}>{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-slate-200 leading-relaxed text-[15px]">{highlightSentence(ex.english, ex.highlight)}</p>
          <p className="text-slate-400 text-sm mt-0.5 italic">{ex.spanish}</p>
        </div>
        <button onClick={() => speakText(ex.english)} className="shrink-0 text-xl leading-none text-slate-500 hover:text-white transition mt-0.5">🔊</button>
      </div>
      {ex.note && <div className={`text-xs rounded-lg px-3 py-1.5 ${c.badge}`}>💡 {ex.note}</div>}
    </div>
  );
}

function TopicView({ topic }: { topic: GrammarTopic }) {
  const c = COLORS[topic.color];
  return (
    <div className="flex flex-col gap-5">
      <div className={`rounded-xl px-4 py-3 border ${c.badge}`}>
        <p className="text-xs font-semibold mb-0.5 opacity-70">Estructura</p>
        <p className="font-mono font-bold text-sm">{topic.structure}</p>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{topic.description}</p>
      <div className="flex flex-col gap-3">
        <h3 className={`text-sm font-semibold ${c.text}`}>{topic.icon} 5 ejemplos</h3>
        {topic.examples.map((ex, i) => <ExampleCard key={i} ex={ex} color={topic.color} index={i} />)}
      </div>
    </div>
  );
}

// ── Quiz component ────────────────────────────────────────────────────────────

const QUIZ_SIZE = 10;

function QuizSection() {
  const [started,  setStarted]  = useState(false);
  const [index,    setIndex]    = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score,    setScore]    = useState(0);
  const [wrong,    setWrong]    = useState<QuizQuestion[]>([]);
  const [finished, setFinished] = useState(false);

  const questions = useMemo(() => shuffle(QUIZ_QUESTIONS).slice(0, QUIZ_SIZE), [started]); // eslint-disable-line
  const current   = questions[index];
  const shuffledOptions = useMemo(() => shuffle(current?.options ?? []), [index, started]); // eslint-disable-line

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === current.correct;
    if (correct) setScore((s) => s + 1);
    else setWrong((w) => [...w, current]);
  }

  function handleNext() {
    if (index + 1 >= QUIZ_SIZE) { setFinished(true); return; }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function restart() {
    setStarted(false);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setWrong([]);
    setFinished(false);
  }

  if (!started) return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <span className="text-6xl">🧪</span>
      <div>
        <h2 className="font-bold text-xl mb-1">Quiz de Gramática</h2>
        <p className="text-slate-400 text-sm">
          {QUIZ_SIZE} preguntas aleatorias de los {QUIZ_QUESTIONS.length} disponibles.<br />
          Elige la opción correcta para completar la oración.
        </p>
      </div>
      <button
        onClick={() => setStarted(true)}
        className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-white"
      >
        Comenzar quiz →
      </button>
    </div>
  );

  if (finished) {
    const pct = Math.round((score / QUIZ_SIZE) * 100);
    const color = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400";
    const msg   = pct >= 80 ? "¡Excelente!" : pct >= 50 ? "Buen intento" : "Sigue practicando";
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-6">
          <p className="text-5xl mb-3">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📚"}</p>
          <p className={`text-3xl font-bold mb-1 ${color}`}>{score}/{QUIZ_SIZE}</p>
          <p className="text-slate-400">{msg} · {pct}% correcto</p>
        </div>
        {wrong.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-rose-400">❌ Preguntas incorrectas</h3>
            {wrong.map((q, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-300 text-sm mb-2">{q.sentence.replace("___", `[${q.correct}]`)}</p>
                <p className="text-xs text-slate-400">💡 {q.explanation}</p>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={restart}
          className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
        >
          🔁 Intentar de nuevo
        </button>
      </div>
    );
  }

  const answered = selected !== null;
  const isCorrect = selected === current.correct;

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all"
            style={{ width: `${((index) / QUIZ_SIZE) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 shrink-0">{index + 1} / {QUIZ_SIZE}</span>
      </div>

      {/* Topic badge */}
      <span className="self-start text-xs px-3 py-1 rounded-full bg-slate-700 text-slate-400">{current.topic}</span>

      {/* Sentence */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <p className="text-slate-200 text-lg leading-relaxed">{renderSentenceWithBlank(current.sentence)}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {shuffledOptions.map((opt) => {
          let cls = "py-3 px-4 rounded-xl text-sm font-medium transition border text-left ";
          if (!answered) {
            cls += "bg-slate-700 border-slate-600 hover:bg-slate-600 text-white";
          } else if (opt === current.correct) {
            cls += "bg-emerald-900/60 border-emerald-600 text-emerald-300";
          } else if (opt === selected) {
            cls += "bg-rose-900/60 border-rose-600 text-rose-300";
          } else {
            cls += "bg-slate-800/40 border-slate-700 text-slate-500";
          }
          return (
            <button key={opt} onClick={() => handleSelect(opt)} className={cls}>
              {answered && opt === current.correct && "✅ "}
              {answered && opt === selected && opt !== current.correct && "❌ "}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300" : "bg-rose-900/40 border border-rose-700 text-rose-300"}`}>
          <p className="font-semibold mb-0.5">{isCorrect ? "¡Correcto!" : `Incorrecto — respuesta: "${current.correct}"`}</p>
          <p className="opacity-80 text-xs">{current.explanation}</p>
        </div>
      )}

      {answered && (
        <button onClick={handleNext} className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold">
          {index + 1 >= QUIZ_SIZE ? "Ver resultados →" : "Siguiente →"}
        </button>
      )}
    </div>
  );
}

// ── Phrasal Verbs component ───────────────────────────────────────────────────

function PhrasalVerbsSection() {
  const [search,    setSearch]    = useState("");
  const [group,     setGroup]     = useState("ALL");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PHRASAL_VERBS.filter((p) => {
      const matchGroup  = group === "ALL" || p.group === group;
      const matchSearch = !q || p.verb.includes(q) || p.spanish.toLowerCase().includes(q);
      return matchGroup && matchSearch;
    });
  }, [search, group]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar phrasal verb o significado…"
        className="w-full rounded-xl bg-slate-700 border border-slate-600 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      />

      {/* Group filter */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max pb-1">
          {PHRASAL_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`text-xs px-3 py-1.5 rounded-full transition font-medium ${
                group === g ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-500">{filtered.length} phrasal verbs</p>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {filtered.map((p) => (
          <div key={p.verb} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-white">{p.verb}</span>
                <span className="text-indigo-400 text-sm">— {p.spanish}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1 italic">"{p.example}"</p>
            </div>
            <button
              onClick={() => speakText(p.example)}
              className="shrink-0 text-lg leading-none text-slate-500 hover:text-white transition"
            >
              🔊
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const SECTIONS: { key: Section; label: string }[] = [
  { key: "reference", label: "📚 Referencia" },
  { key: "quiz",      label: "🧪 Quiz"       },
  { key: "phrasal",   label: "🔗 Phrasal Verbs" },
];

export default function GrammarPage() {
  const [section,  setSection]  = useState<Section>("reference");
  const [activeId, setActiveId] = useState<string>(TOPICS[0].id);
  const active = TOPICS.find((t) => t.id === activeId)!;

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <header className="flex items-center gap-2 px-5 pt-5 pb-3">
        <span className="text-2xl">📝</span>
        <h1 className="font-bold text-lg">Gramática</h1>
      </header>

      {/* Section tabs */}
      <div className="flex border-b border-slate-800">
        {SECTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
              section === key ? "text-white border-indigo-500" : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reference: topic scroll tabs */}
      {section === "reference" && (
        <div className="overflow-x-auto border-b border-slate-800 scrollbar-none">
          <div className="flex min-w-max">
            {TOPICS.map((t) => {
              const isActive = activeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition border-b-2 ${
                    isActive ? `text-white ${COLORS[t.color].border}` : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {section === "reference" && <TopicView topic={active} />}
        {section === "quiz"      && <QuizSection />}
        {section === "phrasal"   && <PhrasalVerbsSection />}
      </main>
    </div>
  );
}
