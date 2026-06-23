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
  {
    id:"simple-present", label:"Simple Present", icon:"🔁", color:"emerald",
    title:"Simple Present", structure:"subject + verb  |  he/she/it + verb-s",
    description:"Expresa rutinas, hábitos y hechos generales. Con he/she/it se añade -s al verbo. Negación: don't / doesn't + base. Pregunta: Do / Does + subject + base.",
    examples:[
      { english:"She studies English every day.", highlight:"studies", spanish:"Ella estudia inglés cada día.", note:"He/she/it → verbo termina en -s/-es." },
      { english:"I don't like cold weather.", highlight:"don't like", spanish:"No me gusta el clima frío.", note:"Negación con I/you/we/they → don't + base form." },
      { english:"Does your mother work on Saturdays?", highlight:"Does", spanish:"¿Tu mamá trabaja los sábados?", note:"Pregunta con he/she/it → Does + subject + base form." },
      { english:"Water boils at 100 degrees Celsius.", highlight:"boils", spanish:"El agua hierve a 100 grados Celsius.", note:"Hecho científico o verdad universal." },
      { english:"We usually have breakfast at seven.", highlight:"have", spanish:"Generalmente desayunamos a las siete.", note:"Rutina diaria con adverbio de frecuencia." },
    ],
  },
  {
    id:"articles", label:"Articles", icon:"📖", color:"sky",
    title:"Articles: the, a, an", structure:"the (específico)  |  a/an (indefinido)",
    description:"'The' (el/la/los/las) señala algo ya conocido o único. 'A' se usa con consonante, 'an' con vocal o sonido vocálico. Omite el artículo con nombres propios y conceptos generales.",
    examples:[
      { english:"She is a teacher.", highlight:"a", spanish:"Ella es maestra.", note:"'A' introduce una profesión o algo no específico. Comienza con consonante → a." },
      { english:"He is an engineer.", highlight:"an", spanish:"Él es ingeniero.", note:"'An' antes de vocal o sonido vocálico (engineer empieza con 'e')." },
      { english:"Close the door, please.", highlight:"the", spanish:"Cierra la puerta, por favor.", note:"'The' → ya sabemos de cuál puerta se habla (contexto)." },
      { english:"The sun rises in the east.", highlight:"The sun", spanish:"El sol sale por el este.", note:"'The' con elementos únicos en el mundo (the sun, the moon, the sky)." },
      { english:"I need a new idea.", highlight:"a", spanish:"Necesito una nueva idea.", note:"'A' introduce algo por primera vez o no específico." },
    ],
  },
  {
    id:"frequency-adverbs", label:"Freq. Adverbs", icon:"📊", color:"indigo",
    title:"Frequency Adverbs", structure:"subject + adverb + verb  |  be + adverb",
    description:"Van entre el sujeto y el verbo principal, o después de 'be'. Always (100%) → usually (90%) → often (80%) → sometimes (50%) → rarely (20%) → never (0%).",
    examples:[
      { english:"She always studies at night.", highlight:"always", spanish:"Ella siempre estudia de noche.", note:"'Always' = 100% de las veces. Va antes del verbo principal." },
      { english:"He is usually at home in the evenings.", highlight:"usually", spanish:"Él está usualmente en casa por las tardes.", note:"Con 'be': subject + be + adverb." },
      { english:"We sometimes go to the cinema on weekends.", highlight:"sometimes", spanish:"A veces vamos al cine los fines de semana.", note:"'Sometimes' puede ir al inicio o en medio de la oración." },
      { english:"How often do you exercise?", highlight:"How often", spanish:"¿Qué tan seguido haces ejercicio?", note:"Pregunta con 'How often' para averiguar frecuencia." },
      { english:"I never drink coffee after 6 pm.", highlight:"never", spanish:"Nunca bebo café después de las 6 pm.", note:"'Never' = 0%. No necesita 'not' — ya es negativo." },
    ],
  },
  {
    id:"comparatives-superlatives", label:"Comp. & Superl.", icon:"📈", color:"amber",
    title:"Comparatives & Superlatives", structure:"adj-er + than  |  more + adj + than  |  the + adj-est  |  the most + adj",
    description:"Comparativos: adjetivos cortos + -er than; largos: more/less + adj + than. Irregulares: good→better→best, bad→worse→worst. Superlativos usan 'the' + -est o the most.",
    examples:[
      { english:"He is taller than his brother.", highlight:"taller than", spanish:"Él es más alto que su hermano.", note:"Adjetivo corto (1 sílaba) → + -er + than." },
      { english:"This phone is more expensive than mine.", highlight:"more expensive than", spanish:"Este teléfono es más caro que el mío.", note:"Adjetivo largo (3+ sílabas) → more + adj + than." },
      { english:"She is the smartest student in class.", highlight:"the smartest", spanish:"Ella es la estudiante más inteligente de la clase.", note:"Superlativo: the + adj + -est. Usa 'in' con grupos." },
      { english:"This is the most delicious cake I've ever eaten.", highlight:"the most delicious", spanish:"Este es el pastel más delicioso que he comido.", note:"Superlativo de adjetivo largo: the most + adj." },
      { english:"My English is getting better every day.", highlight:"better", spanish:"Mi inglés mejora cada día.", note:"Good → better → the best (irregular)." },
    ],
  },
  {
    id:"quantifiers", label:"Quantifiers", icon:"🔢", color:"orange",
    title:"Quantifiers", structure:"some / any / many / much / a few / a little / a lot of",
    description:"Some (positivo/pregunta), any (negativo/pregunta), many/few (contables), much/a little (incontables), a lot of (ambos). Contables se pueden contar; incontables no.",
    examples:[
      { english:"I have some money if you need it.", highlight:"some", spanish:"Tengo algo de dinero si lo necesitas.", note:"'Some' en oraciones positivas y preguntas amables." },
      { english:"There isn't any milk in the fridge.", highlight:"any", spanish:"No hay leche en el refrigerador.", note:"'Any' en oraciones negativas e interrogativas." },
      { english:"She has many friends at school.", highlight:"many", spanish:"Ella tiene muchos amigos en la escuela.", note:"'Many' con sustantivos contables en plural." },
      { english:"We don't have much time.", highlight:"much", spanish:"No tenemos mucho tiempo.", note:"'Much' con sustantivos incontables (time, money, water)." },
      { english:"A lot of people came to the party.", highlight:"A lot of", spanish:"Mucha gente vino a la fiesta.", note:"'A lot of' funciona con contables e incontables." },
    ],
  },
  {
    id:"do-make", label:"Do vs Make", icon:"🛠️", color:"purple",
    title:"Do vs Make", structure:"do (actividades / tareas)  |  make (crear / producir)",
    description:"Do: actividades físicas o mentales, tareas y servicios. Make: crear, producir o causar algo nuevo. Muchas combinaciones son fijas — hay que memorizarlas.",
    examples:[
      { english:"Can you do me a favor?", highlight:"do", spanish:"¿Me puedes hacer un favor?", note:"Do a favor — expresión fija. Do = realizar una acción." },
      { english:"I always do my homework before dinner.", highlight:"do my homework", spanish:"Siempre hago mi tarea antes de cenar.", note:"Do homework / the dishes / the cleaning / exercise." },
      { english:"She made a big mistake.", highlight:"made a mistake", spanish:"Ella cometió un gran error.", note:"Make a mistake — expresión fija. Make = producir un resultado." },
      { english:"Let's make a plan for the weekend.", highlight:"make a plan", spanish:"Hagamos un plan para el fin de semana.", note:"Make a plan / decision / suggestion / phone call." },
      { english:"The music makes me happy.", highlight:"makes me happy", spanish:"La música me hace feliz.", note:"Make + object + adjective → causar un estado en alguien." },
    ],
  },
  {
    id:"connectors", label:"Connectors", icon:"🔗", color:"teal",
    title:"Connectors & Conjunctions", structure:"because / so / although / even though / but / so that",
    description:"Because (causa), so (consecuencia), although/even though (contraste), but (pero), so that/in order to (propósito). Conectan ideas y muestran relación entre ellas.",
    examples:[
      { english:"I didn't buy it because it was too expensive.", highlight:"because", spanish:"No lo compré porque era demasiado caro.", note:"'Because' introduce la causa o razón." },
      { english:"It was raining, so we stayed home.", highlight:"so", spanish:"Estaba lloviendo, así que nos quedamos en casa.", note:"'So' introduce la consecuencia o resultado." },
      { english:"She passed the exam even though she didn't study.", highlight:"even though", spanish:"Pasó el examen aunque no estudió.", note:"'Even though' expresa sorpresa o contraste fuerte." },
      { english:"He is washing the car so that he can take her out.", highlight:"so that", spanish:"Está lavando el carro para poder llevarla a pasear.", note:"'So that' + subject expresa propósito o intención." },
      { english:"I like coffee, but I prefer tea.", highlight:"but", spanish:"Me gusta el café, pero prefiero el té.", note:"'But' conecta ideas opuestas o contrastantes." },
    ],
  },
  {
    id:"to-be", label:"To Be", icon:"🧩", color:"teal",
    title:"To Be: am / is / are", structure:"I am  |  you/we/they are  |  he/she/it is",
    description:"'To be' es el verbo más fundamental en inglés. Describe identidad, profesión, estado y características. Negativo: am/is/are + not. Pregunta: Am/Is/Are + subject + ...?",
    examples:[
      { english:"I am a student from Colombia.", highlight:"am", spanish:"Soy un estudiante de Colombia.", note:"I siempre usa 'am'." },
      { english:"She is very intelligent and hardworking.", highlight:"is", spanish:"Ella es muy inteligente y trabajadora.", note:"He/she/it siempre usa 'is'." },
      { english:"They are not ready yet.", highlight:"are not", spanish:"Ellos no están listos todavía.", note:"Negación: are not / aren't." },
      { english:"Are you from Mexico?", highlight:"Are", spanish:"¿Eres de México?", note:"Pregunta: Are/Am/Is + subject?" },
      { english:"He isn't at home right now.", highlight:"isn't", spanish:"Él no está en casa ahora mismo.", note:"Contracción negativa: isn't = is not." },
    ],
  },
  {
    id:"there-is-are", label:"There is/are", icon:"📍", color:"sky",
    title:"There is / There are", structure:"There is + singular  |  There are + plural",
    description:"Expresa existencia o presencia. 'There is' para singular o incontable, 'There are' para plural. Negativo: isn't / aren't. Pregunta: Is there…? / Are there…?",
    examples:[
      { english:"There is a book on the table.", highlight:"There is", spanish:"Hay un libro sobre la mesa.", note:"Singular → There is. Se contrae: There's." },
      { english:"There are three students in the classroom.", highlight:"There are", spanish:"Hay tres estudiantes en el salón.", note:"Plural → There are." },
      { english:"There isn't any coffee left.", highlight:"There isn't", spanish:"No hay café.", note:"Negativo singular: There isn't (= There is not)." },
      { english:"Are there any questions?", highlight:"Are there", spanish:"¿Hay preguntas?", note:"Pregunta plural: Are there + noun?" },
      { english:"There are no hotels near here.", highlight:"There are no", spanish:"No hay hoteles cerca.", note:"'There are no' + plural noun = alternativa a 'there aren't any'." },
    ],
  },
  {
    id:"possessives", label:"Possessives", icon:"👤", color:"amber",
    title:"Possessive Adjectives & Pronouns", structure:"my/mine · your/yours · his · her/hers · our/ours · their/theirs",
    description:"Los adjetivos posesivos (my, your, his…) preceden al sustantivo. Los pronombres posesivos (mine, yours, his…) lo reemplazan. His no cambia entre adjetivo y pronombre.",
    examples:[
      { english:"This is my book. Is that yours?", highlight:"my", spanish:"Este es mi libro. ¿Es ese tuyo?", note:"My = adjetivo (precede al sustantivo). Yours = pronombre (lo reemplaza)." },
      { english:"Her bag is expensive, but mine is cheap.", highlight:"mine", spanish:"Su bolso es caro, pero el mío es barato.", note:"Mine reemplaza 'my bag' — pronombre posesivo." },
      { english:"Their house is bigger than ours.", highlight:"Their", spanish:"Su casa es más grande que la nuestra.", note:"Their = de ellos (adjetivo). Ours = la nuestra (pronombre)." },
      { english:"The dog hurt its paw.", highlight:"its", spanish:"El perro se lastimó la pata.", note:"Its = de él/ella para animales/cosas. It's (con apóstrofe) = it is." },
      { english:"We forgot our tickets.", highlight:"our", spanish:"Olvidamos nuestras entradas.", note:"Our = nuestro/a/os/as (adjetivo posesivo)." },
    ],
  },
  {
    id:"demonstratives", label:"Demonstratives", icon:"👉", color:"indigo",
    title:"Demonstrative Pronouns", structure:"this / that (singular)  |  these / those (plural)",
    description:"This/these para cosas cercanas; that/those para cosas lejanas. Actúan como adjetivos (this book) o como pronombres solos (this is mine). El plural de this es these; el de that es those.",
    examples:[
      { english:"This phone is mine.", highlight:"This", spanish:"Este teléfono es mío.", note:"This = singular, objeto cercano." },
      { english:"That building is very old.", highlight:"That", spanish:"Ese edificio es muy viejo.", note:"That = singular, objeto lejano." },
      { english:"These shoes are on sale.", highlight:"These", spanish:"Estos zapatos están en oferta.", note:"These = plural, objetos cercanos." },
      { english:"Those clouds look dark.", highlight:"Those", spanish:"Esas nubes se ven oscuras.", note:"Those = plural, objetos lejanos." },
      { english:"Is this your first time here?", highlight:"this", spanish:"¿Es esta tu primera vez aquí?", note:"This también introduce situaciones o contextos actuales." },
    ],
  },
  {
    id:"prepositions-place", label:"Prep. de lugar", icon:"🗺️", color:"orange",
    title:"Prepositions of Place", structure:"in · on · at · next to · behind · between · above · below",
    description:"Las preposiciones de lugar indican dónde está algo. In (dentro de), on (sobre), at (punto exacto), next to (al lado de), between (entre dos), above/below (arriba/abajo sin contacto).",
    examples:[
      { english:"The cat is under the table.", highlight:"under", spanish:"El gato está debajo de la mesa.", note:"Under = debajo de (con o sin contacto)." },
      { english:"The bank is next to the supermarket.", highlight:"next to", spanish:"El banco está al lado del supermercado.", note:"Next to = al lado de." },
      { english:"She sat between Tom and Mary.", highlight:"between", spanish:"Ella se sentó entre Tom y Mary.", note:"Between = entre dos elementos específicos." },
      { english:"The picture is on the wall.", highlight:"on", spanish:"La foto está en la pared.", note:"On = sobre una superficie (vertical u horizontal)." },
      { english:"There is a bridge above the river.", highlight:"above", spanish:"Hay un puente sobre el río.", note:"Above = encima de / por encima de (sin contacto directo)." },
    ],
  },
  {
    id:"prepositions-time", label:"Prep. de tiempo", icon:"🕐", color:"lime",
    title:"Prepositions of Time", structure:"at (hora) · on (día/fecha) · in (mes/año) · by · since · for",
    description:"At para horas y momentos exactos, on para días y fechas específicas, in para meses, años y períodos. By = antes de cierto tiempo límite. Since = desde un punto. For = durante una duración.",
    examples:[
      { english:"The meeting starts at 9 o'clock.", highlight:"at", spanish:"La reunión empieza a las 9 en punto.", note:"At + hora exacta o momento preciso." },
      { english:"I was born on March 15th.", highlight:"on", spanish:"Nací el 15 de marzo.", note:"On + fecha o día específico." },
      { english:"She graduated in 2020.", highlight:"in", spanish:"Ella se graduó en 2020.", note:"In + año, mes o estación." },
      { english:"Please finish the report by Friday.", highlight:"by", spanish:"Por favor termina el informe para el viernes.", note:"By = antes de cierta fecha o límite." },
      { english:"I have lived here for five years.", highlight:"for", spanish:"He vivido aquí durante cinco años.", note:"For + duración de tiempo. Since + punto de inicio." },
    ],
  },
  {
    id:"reflexive-pronouns", label:"Reflexive Pron.", icon:"🪞", color:"violet",
    title:"Reflexive Pronouns", structure:"myself · yourself · himself · herself · itself · ourselves · yourselves · themselves",
    description:"Se usan cuando el sujeto y el objeto son la misma persona, para énfasis (I did it myself = yo solito), y en expresiones fijas (help yourself, enjoy yourself, by oneself).",
    examples:[
      { english:"She taught herself to play the guitar.", highlight:"herself", spanish:"Ella sola se enseñó a tocar la guitarra.", note:"El sujeto y el objeto son la misma persona." },
      { english:"I hurt myself at the gym.", highlight:"myself", spanish:"Me lastimé en el gimnasio.", note:"Myself = me lastimé a mí mismo." },
      { english:"They built the house themselves.", highlight:"themselves", spanish:"Ellos mismos construyeron la casa.", note:"Themselves = énfasis: sin ayuda de nadie." },
      { english:"Help yourself to some food.", highlight:"yourself", spanish:"Sírvete algo de comer.", note:"Expresión fija: help yourself = sírvete tú mismo." },
      { english:"The machine turns itself off automatically.", highlight:"itself", spanish:"La máquina se apaga sola automáticamente.", note:"Itself para objetos o animales." },
    ],
  },
  {
    id:"tag-questions", label:"Tag Questions", icon:"❓", color:"pink",
    title:"Tag Questions", structure:"positive sentence + negative tag?  |  negative sentence + positive tag?",
    description:"Confirman información o piden acuerdo. Oración positiva → tag negativa. Oración negativa → tag positiva. El auxiliar en el tag coincide con el tiempo de la oración principal.",
    examples:[
      { english:"She works here, doesn't she?", highlight:"doesn't she", spanish:"Ella trabaja aquí, ¿verdad?", note:"Simple present positivo + she → doesn't she?" },
      { english:"You aren't coming, are you?", highlight:"are you", spanish:"No vas a venir, ¿verdad?", note:"Negativo continuo → tag positiva: are you?" },
      { english:"They have met before, haven't they?", highlight:"haven't they", spanish:"Ellos se han conocido antes, ¿no?", note:"Present perfect positivo → haven't they?" },
      { english:"It wasn't raining, was it?", highlight:"was it", spanish:"No estaba lloviendo, ¿verdad?", note:"Past continuous negativo → tag positiva: was it?" },
      { english:"You can swim, can't you?", highlight:"can't you", spanish:"Puedes nadar, ¿verdad?", note:"Modal positivo → tag negativa con can't." },
    ],
  },
  {
    id:"indefinite-pronouns", label:"Indef. Pronouns", icon:"🔍", color:"yellow",
    title:"Indefinite Pronouns", structure:"some- · any- · no- + one / body / thing / where",
    description:"'Some-' en afirmaciones y ofertas. 'Any-' en negaciones y preguntas. 'No-' equivale a negación sin 'not'. Compounds: -one/-body (persona), -thing (cosa), -where (lugar). Verbo siempre singular.",
    examples:[
      { english:"Someone left their bag in the classroom.", highlight:"Someone", spanish:"Alguien dejó su bolso en el salón.", note:"Someone = alguna persona (en afirmaciones)." },
      { english:"I don't know anything about it.", highlight:"anything", spanish:"No sé nada sobre eso.", note:"Anything en oraciones negativas." },
      { english:"Nobody told me about the meeting.", highlight:"Nobody", spanish:"Nadie me dijo sobre la reunión.", note:"Nobody/no one = ninguna persona. Verbo en singular." },
      { english:"Is there anything I can do to help?", highlight:"anything", spanish:"¿Hay algo en que pueda ayudar?", note:"Anything en preguntas." },
      { english:"I want to go somewhere warm this winter.", highlight:"somewhere", spanish:"Quiero ir a algún lugar cálido este invierno.", note:"Somewhere = algún lugar (en afirmaciones)." },
    ],
  },
  {
    id:"relative-pronouns", label:"Relative Pron.", icon:"🔗", color:"rose",
    title:"Relative Pronouns", structure:"who (personas) · which (cosas) · that (ambos) · whose (posesión) · where (lugar)",
    description:"Introducen cláusulas que dan información sobre un sustantivo. Who/that para personas, which/that para cosas, whose para posesión, where para lugares. That es más informal que who/which.",
    examples:[
      { english:"The man who called you is my uncle.", highlight:"who", spanish:"El hombre que te llamó es mi tío.", note:"Who = pronombre relativo para personas." },
      { english:"I bought the book which you recommended.", highlight:"which", spanish:"Compré el libro que recomendaste.", note:"Which = pronombre relativo para cosas (más formal)." },
      { english:"The student whose bag was stolen called the police.", highlight:"whose", spanish:"El estudiante cuya bolsa fue robada llamó a la policía.", note:"Whose = posesión. Reemplaza his/her/their." },
      { english:"The restaurant where we had dinner is closing.", highlight:"where", spanish:"El restaurante donde cenamos está cerrando.", note:"Where = pronombre relativo para lugares." },
      { english:"She is the person that fixed my computer.", highlight:"that", spanish:"Ella es la persona que arregló mi computadora.", note:"That = informal, para personas o cosas." },
    ],
  },
  {
    id:"already-yet-just", label:"Already/Yet/Just", icon:"⏱️", color:"purple",
    title:"Already, Yet & Just", structure:"already (ya) · yet (todavía) · just (recién)",
    description:"Already: algo ocurrió antes de lo esperado (afirmaciones, entre have y participio). Yet: algo no ha ocurrido pero se espera (negaciones y preguntas, al final). Just: hace muy poco (afirmaciones).",
    examples:[
      { english:"I have already finished my homework.", highlight:"already", spanish:"Ya terminé mi tarea.", note:"Already en afirmaciones → ocurrió antes de lo esperado." },
      { english:"Have you eaten yet?", highlight:"yet", spanish:"¿Ya comiste?", note:"Yet en preguntas → ¿ya ocurrió lo esperado? Al final." },
      { english:"She hasn't called me yet.", highlight:"yet", spanish:"Ella todavía no me ha llamado.", note:"Yet en negaciones → al final de la oración." },
      { english:"He has just arrived from London.", highlight:"just", spanish:"Él acaba de llegar de Londres.", note:"Just = hace muy poco. Entre have y el participio." },
      { english:"Don't call him — he has already left.", highlight:"already left", spanish:"No lo llames, ya se fue.", note:"Already también se usa en afirmaciones con simple past." },
    ],
  },
  {
    id:"modal-past", label:"Modales pasado", icon:"🔙", color:"orange",
    title:"Modal Verbs in the Past", structure:"could / should / would / might + have + past participle",
    description:"Expresan situaciones hipotéticas ya imposibles de cambiar. Should have = reproche o consejo tardío. Could have = posibilidad no realizada. Might have = suposición. Would have = resultado hipotético.",
    examples:[
      { english:"You should have studied more for the exam.", highlight:"should have studied", spanish:"Debiste haber estudiado más para el examen.", note:"Should have + participio = reproche o arrepentimiento." },
      { english:"I could have helped you if you had asked.", highlight:"could have helped", spanish:"Podría haberte ayudado si me lo hubieras pedido.", note:"Could have + participio = posibilidad pasada no realizada." },
      { english:"She might have taken the wrong bus.", highlight:"might have taken", spanish:"Puede que haya tomado el bus equivocado.", note:"Might have + participio = suposición sobre el pasado." },
      { english:"He would have called, but he lost his phone.", highlight:"would have called", spanish:"Él habría llamado, pero perdió su teléfono.", note:"Would have + participio = resultado hipotético (3rd conditional)." },
      { english:"I shouldn't have eaten so much.", highlight:"shouldn't have eaten", spanish:"No debí haber comido tanto.", note:"Shouldn't have = arrepentimiento por algo que se hizo." },
    ],
  },
  {
    id:"wish", label:"Wish", icon:"🌠", color:"indigo",
    title:"The Use of Wish", structure:"wish + past simple (presente) | wish + past perfect (pasado) | wish + would",
    description:"Wish expresa deseos imposibles. Wish + past simple = deseo sobre el presente (irrealizable). Wish + past perfect = arrepentimiento. Wish + would = deseo de cambio en otro. 'Were' para todos los sujetos.",
    examples:[
      { english:"I wish I had more time.", highlight:"had", spanish:"Ojalá tuviera más tiempo.", note:"Wish + past simple → deseo presente imposible. 'Had', no 'have'." },
      { english:"She wishes she could fly.", highlight:"could fly", spanish:"Ella desea poder volar.", note:"Wish + could + base = deseo de una habilidad." },
      { english:"I wish I hadn't said that.", highlight:"hadn't said", spanish:"Ojalá no hubiera dicho eso.", note:"Wish + past perfect → arrepentimiento por algo en el pasado." },
      { english:"He wishes he were taller.", highlight:"were", spanish:"Él desea ser más alto.", note:"Were en lugar de was con wish — correcto en todos los sujetos." },
      { english:"I wish you would stop complaining.", highlight:"would stop", spanish:"Ojalá dejaras de quejarte.", note:"Wish + would → deseo de cambio en el comportamiento de otro." },
    ],
  },
  {
    id:"very-too", label:"Very & Too", icon:"⚖️", color:"emerald",
    title:"Very vs Too", structure:"very + adjective/adverb (neutro) | too + adjective + to-infinitive (exceso)",
    description:"Very intensifica de forma neutra, sin implicar problema. Too implica un exceso con consecuencia negativa — algo no es posible o deseable. 'Too + adj + to + infinitivo' es la estructura clave.",
    examples:[
      { english:"The movie was very interesting.", highlight:"very", spanish:"La película fue muy interesante.", note:"Very = intensificador neutro. Sin consecuencia negativa." },
      { english:"It's too hot to go outside.", highlight:"too hot to", spanish:"Hace demasiado calor para salir.", note:"Too + adj + to-infinitivo = exceso que impide algo." },
      { english:"She is very tall for her age.", highlight:"very", spanish:"Ella es muy alta para su edad.", note:"Very + adjetivo sin implicar problema." },
      { english:"The coffee is too cold to drink.", highlight:"too cold", spanish:"El café está demasiado frío para tomarlo.", note:"Too implica que el resultado no es posible o agradable." },
      { english:"He speaks English very well.", highlight:"very well", spanish:"Él habla inglés muy bien.", note:"Very también modifica adverbios. Well es el adverbio de good." },
    ],
  },
  {
    id:"few-little", label:"Few vs Little", icon:"🔢", color:"sky",
    title:"Few vs Little", structure:"a few / few + countable plural  |  a little / little + uncountable",
    description:"Few se usa con sustantivos contables (cosas que se pueden contar: friends, cars, ideas). Little se usa con sustantivos incontables (cosas sin plural: water, time, money). Con 'a' son positivos (hay algo); sin 'a' son negativos (hay casi nada).",
    examples:[
      { english:"I have a few friends I can really trust.", highlight:"a few", spanish:"Tengo algunos amigos en quienes realmente confiar.", note:"A few + contable = algunos (positivo). Friends se puede contar." },
      { english:"There is a little milk left — enough for coffee.", highlight:"a little", spanish:"Queda un poco de leche — suficiente para café.", note:"A little + incontable = un poco (positivo). Milk no tiene plural." },
      { english:"Few people know the real story.", highlight:"Few", spanish:"Pocas personas conocen la historia real.", note:"Few sin 'a' = casi nadie (negativo). People es contable." },
      { english:"We have little time before the flight.", highlight:"little", spanish:"Tenemos poco tiempo antes del vuelo.", note:"Little sin 'a' = casi nada (negativo). Time es incontable." },
      { english:"Can I borrow a few dollars? Just for the bus.", highlight:"a few", spanish:"¿Me prestas unos dólares? Solo para el bus.", note:"Dollars se puede contar → a few. No se dice 'a few money'." },
    ],
  },
  {
    id:"either-neither", label:"Either / Neither", icon:"⚖️", color:"violet",
    title:"Either vs Neither", structure:"either (uno u otro) | neither (ninguno) | either…or | neither…nor",
    description:"Either = cualquiera de los dos (en positivo) o 'también no' (en negativo). Neither = ninguno de los dos. Either…or presenta dos opciones. Neither…nor descarta las dos. El verbo con neither suele ser singular.",
    examples:[
      { english:"Either option sounds fine to me.", highlight:"Either", spanish:"Cualquiera de las dos opciones me parece bien.", note:"Either = cualquiera de dos opciones. Verbo singular." },
      { english:"Neither answer is correct.", highlight:"Neither", spanish:"Ninguna de las dos respuestas es correcta.", note:"Neither = ninguno de los dos. Siempre verbo singular." },
      { english:"\"I don't like Mondays.\" \"Me neither.\"", highlight:"Me neither", spanish:"\"No me gustan los lunes.\" \"A mí tampoco.\"", note:"Me neither = responde a negaciones. Equivale a 'Yo tampoco'." },
      { english:"You can either call or send me a message.", highlight:"either call or", spanish:"Puedes llamarme o mandarme un mensaje.", note:"Either…or = o…o. Presenta dos alternativas posibles." },
      { english:"Neither the manager nor the staff were informed.", highlight:"Neither the manager nor", spanish:"Ni el gerente ni el personal fueron informados.", note:"Neither…nor = ni…ni. Descarta ambas opciones." },
    ],
  },
  {
    id:"say-tell", label:"Say vs Tell", icon:"💬", color:"rose",
    title:"Say vs Tell", structure:"say + (to person) + message  |  tell + person + message",
    description:"Say enfoca en las palabras exactas pronunciadas. Tell enfoca en transmitir información a alguien — siempre necesita un receptor (tell me, tell him). Expresiones fijas: tell the truth, tell a lie, tell a story, tell a joke.",
    examples:[
      { english:"She said she was tired.", highlight:"said", spanish:"Dijo que estaba cansada.", note:"Say + message. No necesita receptor directo." },
      { english:"He told me to wait outside.", highlight:"told me", spanish:"Me dijo que esperara afuera.", note:"Tell + person + message. Siempre lleva receptor." },
      { english:"What did she say?", highlight:"say", spanish:"¿Qué dijo ella?", note:"Say sin receptor. Preguntamos por las palabras exactas." },
      { english:"Can you tell me the way to the station?", highlight:"tell me", spanish:"¿Puedes decirme cómo llegar a la estación?", note:"Tell me = informarme. No se dice 'say me'." },
      { english:"Don't tell lies — just tell the truth.", highlight:"tell lies", spanish:"No digas mentiras — di la verdad.", note:"Tell a lie / tell the truth → expresiones fijas con 'tell'." },
    ],
  },
  {
    id:"see-watch-look", label:"See/Watch/Look", icon:"👁️", color:"teal",
    title:"See vs Watch vs Look", structure:"see (percibir) | look at (observar) | watch (seguir con atención)",
    description:"See = percibir algo sin esfuerzo, el ojo lo capta solo. Look (at) = dirigir la mirada intencionalmente hacia algo. Watch = seguir algo en movimiento con atención durante un tiempo (películas, partidos, personas). Look es acción; see puede ser involuntario.",
    examples:[
      { english:"Can you see that bird in the tree?", highlight:"see", spanish:"¿Puedes ver ese pájaro en el árbol?", note:"See = percibir sin esfuerzo. El pájaro está ahí y el ojo lo capta." },
      { english:"Look at that sunset — it's beautiful!", highlight:"Look at", spanish:"¡Mira ese atardecer — es hermoso!", note:"Look at = dirigir la mirada a algo específico. Acción intencional." },
      { english:"We watched the game for three hours.", highlight:"watched", spanish:"Vimos el partido durante tres horas.", note:"Watch = seguir algo durante un tiempo con atención (deportes, TV)." },
      { english:"She looked at me and smiled.", highlight:"looked at", spanish:"Ella me miró y sonrió.", note:"Look at = mirar deliberadamente a una persona." },
      { english:"I didn't see you come in — I was reading.", highlight:"see", spanish:"No te vi entrar — estaba leyendo.", note:"See = percepción involuntaria. No estaba buscando verlo." },
    ],
  },
  {
    id:"bring-take", label:"Bring vs Take", icon:"↔️", color:"sky",
    title:"Bring vs Take", structure:"bring (hacia aquí / donde estaremos) | take (hacia allá / lejos de aquí)",
    description:"Bring = traer algo hacia donde está el hablante o hacia un destino compartido. Take = llevar algo lejos del hablante. Piénsalo como 'come' (bring) vs 'go' (take): si 'vienes', traes; si 'vas', llevas.",
    examples:[
      { english:"Bring me a glass of water, please.", highlight:"Bring", spanish:"Tráeme un vaso de agua, por favor.", note:"El agua viene hacia donde estoy yo → bring." },
      { english:"Don't forget to take your umbrella.", highlight:"take", spanish:"No olvides llevar tu paraguas.", note:"El paraguas va contigo lejos de aquí → take." },
      { english:"Can you bring your laptop to the meeting?", highlight:"bring", spanish:"¿Puedes traer tu laptop a la reunión?", note:"La reunión es donde estaremos los dos → bring." },
      { english:"I'll take the kids to school this morning.", highlight:"take", spanish:"Llevaré a los niños a la escuela esta mañana.", note:"La escuela está lejos de aquí, tú vas con ellos → take." },
      { english:"She brought flowers to the party.", highlight:"brought", spanish:"Ella trajo flores a la fiesta.", note:"Llegó a la fiesta con flores (hacia ese lugar) → brought." },
    ],
  },
  {
    id:"borrow-lend", label:"Borrow vs Lend", icon:"🤝", color:"amber",
    title:"Borrow vs Lend", structure:"borrow (pedir prestado / recibir) | lend (prestar / dar)",
    description:"Borrow = recibir algo temporalmente (yo tomo prestado). Lend = dar algo temporalmente (yo presto). Mismo significado pero distinta perspectiva. 'Can I borrow your pen?' y 'Can you lend me your pen?' dicen lo mismo pero desde lados opuestos.",
    examples:[
      { english:"Can I borrow your pen for a minute?", highlight:"borrow", spanish:"¿Puedo usar tu pluma un momento?", note:"Yo soy el receptor → borrow. No se dice 'Can I lend your pen?'." },
      { english:"He borrowed money from the bank.", highlight:"borrowed", spanish:"Pidió dinero prestado al banco.", note:"Él recibió el dinero → borrowed from." },
      { english:"She lent me her car for the weekend.", highlight:"lent", spanish:"Ella me prestó su carro el fin de semana.", note:"Ella fue la dadora → lent. Pasado de lend = lent." },
      { english:"I'll lend you my notes if you want.", highlight:"lend", spanish:"Te presto mis apuntes si quieres.", note:"Yo soy el dador → lend. 'Lend to' o 'lend + person'." },
      { english:"Never lend money to friends — it ruins relationships.", highlight:"lend", spanish:"Nunca le prestes dinero a amigos — arruina las relaciones.", note:"Lend = dar prestado. El que presta usa 'lend'." },
    ],
  },
  {
    id:"during-while-for", label:"During/While/For", icon:"⏱️", color:"teal",
    title:"During vs While vs For", structure:"during + noun | while + clause (subject + verb) | for + duration",
    description:"During = durante + sustantivo. While = mientras + oración completa (sujeto + verbo). For = durante + cantidad de tiempo. During y while son equivalentes en significado pero necesitan estructuras distintas. For solo expresa duración.",
    examples:[
      { english:"She fell asleep during the movie.", highlight:"during", spanish:"Se quedó dormida durante la película.", note:"During + noun (the movie). No puede ir seguido de 'she was watching'." },
      { english:"She fell asleep while she was watching the movie.", highlight:"while", spanish:"Se quedó dormida mientras veía la película.", note:"While + clause completa (subject + verb)." },
      { english:"I studied for three hours without a break.", highlight:"for three hours", spanish:"Estudié durante tres horas sin descanso.", note:"For + duración de tiempo. No es un evento sino una cantidad." },
      { english:"During the meeting, nobody spoke.", highlight:"During the meeting", spanish:"Durante la reunión, nadie habló.", note:"During + noun phrase al inicio de la oración." },
      { english:"While I was cooking, he was setting the table.", highlight:"While", spanish:"Mientras yo cocinaba, él ponía la mesa.", note:"While conecta dos acciones simultáneas en el pasado." },
    ],
  },
  {
    id:"although-despite", label:"Although / Despite", icon:"⚡", color:"rose",
    title:"Although vs Despite vs In spite of", structure:"although / even though + clause | despite / in spite of + noun / -ing",
    description:"Although y even though van seguidos de una oración completa (sujeto + verbo). Despite e in spite of van seguidos de un sustantivo o gerundio (-ing). Todos expresan contraste. Even though tiene un matiz más fuerte de sorpresa.",
    examples:[
      { english:"Although it was raining, we went for a walk.", highlight:"Although", spanish:"Aunque llovía, salimos a caminar.", note:"Although + clause completa (it was raining)." },
      { english:"Despite the rain, we went for a walk.", highlight:"Despite the rain", spanish:"A pesar de la lluvia, salimos a caminar.", note:"Despite + noun (the rain). Mismo significado, diferente estructura." },
      { english:"She passed the exam even though she hadn't studied.", highlight:"even though", spanish:"Pasó el examen aunque no había estudiado.", note:"Even though = contraste fuerte o inesperado." },
      { english:"In spite of being tired, he finished the report.", highlight:"In spite of being", spanish:"A pesar de estar cansado, terminó el informe.", note:"In spite of + -ing. Sinónimo exacto de 'despite'." },
      { english:"Despite working hard, she didn't get the promotion.", highlight:"Despite working", spanish:"A pesar de trabajar duro, no obtuvo el ascenso.", note:"Despite + -ing (no despite + that + clause)." },
    ],
  },
  {
    id:"also-too-either", label:"Also / Too / Either", icon:"➕", color:"lime",
    title:"Also vs Too vs Either", structure:"also (also + verb / after be) | too (end, affirmative) | either (end, negative)",
    description:"Also y too = también (afirmaciones). Also va antes del verbo principal o después de be/auxiliar — más formal. Too va al final de la oración — más informal. Either = también no, en oraciones negativas al final. 'Me too' vs 'Me neither/either'.",
    examples:[
      { english:"She also speaks French.", highlight:"also", spanish:"Ella también habla francés.", note:"Also antes del verbo principal. Registro más formal." },
      { english:"I like sushi. My sister likes it too.", highlight:"too", spanish:"Me gusta el sushi. A mi hermana también.", note:"Too al final. Informal y muy común en conversación." },
      { english:"I don't like spinach. — I don't either.", highlight:"either", spanish:"No me gusta la espinaca. — A mí tampoco.", note:"Either al final de oraciones negativas = también no." },
      { english:"He is also a great cook.", highlight:"also", spanish:"Él también es un gran cocinero.", note:"Also después de 'be' o auxiliar." },
      { english:"She can't drive, and I can't either.", highlight:"either", spanish:"Ella no sabe manejar, y yo tampoco.", note:"Either con 'can't' → yo tampoco. Alternativa: 'Neither can I'." },
    ],
  },
  {
    id:"so-such", label:"So vs Such", icon:"💥", color:"orange",
    title:"So vs Such", structure:"so + adjective / adverb | such (a/an) + (adjective) + noun",
    description:"So intensifica adjetivos y adverbios directamente. Such intensifica sustantivos (con o sin adjetivo). Con 'that' expresan consecuencia: so tired that... / such a long day that... Truco: si puedes poner 'a/an' después, usa 'such'.",
    examples:[
      { english:"The movie was so boring that I fell asleep.", highlight:"so boring", spanish:"La película era tan aburrida que me quedé dormido.", note:"So + adjective + that = consecuencia." },
      { english:"It was such a beautiful day that we went to the beach.", highlight:"such a beautiful day", spanish:"Era un día tan hermoso que fuimos a la playa.", note:"Such a + adjective + noun. El 'a/an' va después de 'such'." },
      { english:"She speaks so quickly that I can't understand her.", highlight:"so quickly", spanish:"Habla tan rápido que no puedo entenderla.", note:"So + adverb (quickly)." },
      { english:"He has such a good memory — he never forgets anything.", highlight:"such a good memory", spanish:"Tiene tan buena memoria — nunca olvida nada.", note:"Such a + adjective + noun, sin consecuencia explícita." },
      { english:"I'm so happy to see you!", highlight:"so happy", spanish:"¡Estoy tan feliz de verte!", note:"So + adjective sin 'that'. Muy común en conversación." },
    ],
  },
  {
    id:"miss-lose-fail", label:"Miss / Lose / Fail", icon:"❌", color:"pink",
    title:"Miss vs Lose vs Fail", structure:"miss (no llegar a tiempo / extrañar) | lose (perder algo que tenías) | fail (reprobar / fracasar)",
    description:"Tres palabras que en español se traducen como 'perder' o 'fallar' pero en inglés son distintas. Miss = no alcanzar algo por llegar tarde, o extrañar a alguien. Lose = dejar de tener algo. Fail = no pasar una prueba o no lograr algo.",
    examples:[
      { english:"I missed the bus by two minutes.", highlight:"missed", spanish:"Perdí el bus por dos minutos.", note:"Miss = no llegar a tiempo para tomar algo." },
      { english:"She misses her family a lot.", highlight:"misses", spanish:"Ella extraña mucho a su familia.", note:"Miss = extrañar a alguien o algo ausente." },
      { english:"I lost my keys somewhere in the house.", highlight:"lost", spanish:"Perdí mis llaves en algún lugar de la casa.", note:"Lose = dejar de tener algo que tenías." },
      { english:"He failed the driving test three times.", highlight:"failed", spanish:"Reprobó el examen de manejo tres veces.", note:"Fail = no pasar un examen o no lograr algo." },
      { english:"Don't miss this opportunity — it won't come again.", highlight:"miss", spanish:"No pierdas esta oportunidad — no volverá.", note:"Miss = no aprovechar algo que está disponible." },
    ],
  },
  {
    id:"false-friends", label:"Falsos amigos", icon:"🚫", color:"yellow",
    title:"False Friends", structure:"palabras similares al español con significado diferente",
    description:"Los 'falsos amigos' parecen palabras conocidas pero significan algo distinto. Actually ≠ actualmente (= en realidad). Sensible ≠ sensible (= sensato). Embarrassed ≠ embarazada (= avergonzado). Eventually ≠ eventualmente (= tarde o temprano). ¡Cuidado con estas trampas!",
    examples:[
      { english:"Actually, I think you're wrong.", highlight:"Actually", spanish:"En realidad, creo que estás equivocado.", note:"Actually = en realidad / de hecho. NOT actualmente → currently." },
      { english:"She is very sensible about money.", highlight:"sensible", spanish:"Ella es muy sensata con el dinero.", note:"Sensible = sensato/prudente. NOT sensible al dolor → sensitive." },
      { english:"He was embarrassed when he forgot her name.", highlight:"embarrassed", spanish:"Se sintió avergonzado cuando olvidó su nombre.", note:"Embarrassed = avergonzado. NOT embarazada → pregnant." },
      { english:"The project will eventually be finished.", highlight:"eventually", spanish:"El proyecto tarde o temprano se terminará.", note:"Eventually = tarde o temprano / finalmente. NOT eventualmente → possibly." },
      { english:"She is currently working on a new project.", highlight:"currently", spanish:"Ella actualmente está trabajando en un nuevo proyecto.", note:"Currently = actualmente / en este momento. NOT currently → actualmente en inglés." },
    ],
  },
  {
    id:"know-meet", label:"Know vs Meet", icon:"👥", color:"violet",
    title:"Know vs Meet", structure:"know (conocer = tener relación) | meet (conocer = primer encuentro / reunirse)",
    description:"Know = conocer a alguien, tener una relación establecida. Meet = conocer a alguien por primera vez, o encontrarse/reunirse con alguien. 'Nice to meet you' es siempre el primer contacto. Una vez que lo conoces, ya lo 'know'.",
    examples:[
      { english:"Nice to meet you! I've heard a lot about you.", highlight:"meet", spanish:"¡Mucho gusto! He escuchado mucho sobre ti.", note:"Meet = primer encuentro. Solo se dice 'Nice to meet you' la primera vez." },
      { english:"I've known her for ten years — she's my best friend.", highlight:"known", spanish:"La conozco desde hace diez años — es mi mejor amiga.", note:"Know = relación ya establecida. Present perfect: have known." },
      { english:"Where did you two meet?", highlight:"meet", spanish:"¿Dónde se conocieron ustedes dos?", note:"Meet = el momento del primer encuentro." },
      { english:"Do you know that man over there?", highlight:"know", spanish:"¿Conoces a ese hombre de allá?", note:"Know = ¿tienes relación con él? No es la primera vez." },
      { english:"Let's meet at the café at 5.", highlight:"meet", spanish:"Encontrémonos en el café a las 5.", note:"Meet = reunirse / quedar con alguien (no primer encuentro)." },
    ],
  },
  {
    id:"causative", label:"Make/Let/Get/Have", icon:"🎯", color:"purple",
    title:"Causative: Make / Let / Get / Have", structure:"make + person + base | let + person + base | get + person + to-inf | have + person + base",
    description:"Make = obligar (sin opción). Let = permitir. Get = convencer o lograr que alguien haga algo. Have = encargar a alguien que haga algo (servicio). Make y let van con base verb (sin to). Get va con to-infinitivo. Have puede ir con base o past participle.",
    examples:[
      { english:"My boss makes me work overtime every week.", highlight:"makes me work", spanish:"Mi jefe me obliga a trabajar horas extra cada semana.", note:"Make + person + base = obligar. Sin opción de negarse." },
      { english:"My parents let me stay out until midnight.", highlight:"let me stay", spanish:"Mis padres me dejan quedarme afuera hasta medianoche.", note:"Let + person + base = permitir. No hay presión, solo permiso." },
      { english:"I'll get someone to fix the leaking pipe.", highlight:"get someone to fix", spanish:"Conseguiré que alguien arregle la tubería.", note:"Get + person + to-infinitivo = convencer o encargar." },
      { english:"She had her hair cut at the salon.", highlight:"had her hair cut", spanish:"Se cortó el pelo en el salón.", note:"Have + object + past participle = encargar un servicio." },
      { english:"Don't let them see you like this.", highlight:"let them see", spanish:"No los dejes verte así.", note:"Let en negativo = no permitir. Siempre + base verb." },
    ],
  },
  {
    id:"used-to", label:"Used to", icon:"🔙", color:"emerald",
    title:"Used to / Be used to / Get used to", structure:"used to + base (hábito pasado) | be used to + -ing (acostumbrado) | get used to + -ing (acostumbrarse)",
    description:"Used to = hábito o estado del pasado que ya NO existe. Be used to = estar acostumbrado (estado actual). Get used to = proceso de acostumbrarse. Error clásico: 'I used to smoke' (ya no fumo) ≠ 'I am used to smoking' (estoy acostumbrado a fumar).",
    examples:[
      { english:"I used to play football every weekend.", highlight:"used to play", spanish:"Solía jugar fútbol cada fin de semana.", note:"Hábito del pasado que ya no ocurre. Solo existe en pasado." },
      { english:"She used to live in Paris when she was young.", highlight:"used to live", spanish:"Vivía en París cuando era joven.", note:"Estado pasado que ya no es actual → used to." },
      { english:"Are you used to the cold weather yet?", highlight:"used to the cold", spanish:"¿Ya estás acostumbrado al clima frío?", note:"Be used to + noun = estar acostumbrado (estado presente)." },
      { english:"It takes time to get used to a new city.", highlight:"get used to", spanish:"Toma tiempo acostumbrarse a una ciudad nueva.", note:"Get used to + -ing = proceso de adaptación." },
      { english:"He didn't use to like vegetables, but now he loves them.", highlight:"use to like", spanish:"Antes no le gustaban los vegetales, pero ahora los ama.", note:"Negativo e interrogativo: 'didn't use to' (sin -d)." },
    ],
  },
  {
    id:"would-rather", label:"Would Rather / Had Better", icon:"⚠️", color:"indigo",
    title:"Would Rather vs Had Better", structure:"would rather + base (+ than) | had better + base",
    description:"Would rather = preferir (entre opciones). Had better = más vale que (advertencia — implica consecuencia negativa si no se hace). Ambos van con base verb sin to. En contracción: I'd rather / you'd better. Had better no es pasado.",
    examples:[
      { english:"I'd rather stay home than go out tonight.", highlight:"rather stay", spanish:"Prefiero quedarme en casa que salir esta noche.", note:"Would rather + base + than = preferir algo sobre otra opción." },
      { english:"She'd rather read than watch TV.", highlight:"rather read", spanish:"Ella prefiere leer que ver TV.", note:"Would rather + base verb. Sin 'to'." },
      { english:"You'd better call him — he's been waiting for hours.", highlight:"better call", spanish:"Más vale que lo llames — lleva horas esperando.", note:"Had better = advertencia. Implica consecuencia negativa." },
      { english:"We'd better leave now or we'll miss the train.", highlight:"better leave", spanish:"Más nos vale irnos ahora o perderemos el tren.", note:"Had better + or + consecuencia = urgencia." },
      { english:"Would you rather have coffee or tea?", highlight:"rather have", spanish:"¿Prefieres café o té?", note:"Pregunta con would rather para pedir preferencia." },
    ],
  },
  {
    id:"ing-ed-adjectives", label:"-ing vs -ed adj.", icon:"😊", color:"sky",
    title:"-ing vs -ed Adjectives", structure:"-ed (cómo se siente la persona) | -ing (qué causa ese sentimiento)",
    description:"Los adjetivos en -ed describen el estado emocional de una persona. Los adjetivos en -ing describen la característica de algo que causa ese estado. Error muy común: 'I'm boring' ❌ significa que TÚ eres aburrido. Lo correcto: 'I'm bored' ✓ = yo me siento aburrido.",
    examples:[
      { english:"The movie was so boring.", highlight:"boring", spanish:"La película era tan aburrida.", note:"-ing describe la película. Ella causa aburrimiento." },
      { english:"I was so bored during the movie.", highlight:"bored", spanish:"Me aburrí tanto durante la película.", note:"-ed describe cómo me sentí YO. Yo experimenté el aburrimiento." },
      { english:"That was an interesting lecture.", highlight:"interesting", spanish:"Fue una clase muy interesante.", note:"-ing: la clase es la que despierta interés." },
      { english:"I was very interested in what she said.", highlight:"interested", spanish:"Estaba muy interesado en lo que dijo.", note:"-ed: yo sentí el interés." },
      { english:"The news was shocking — everyone was shocked.", highlight:"shocking", spanish:"La noticia fue impactante — todos estaban impactados.", note:"-ing causa el sentimiento, -ed es el efecto en las personas." },
    ],
  },
  {
    id:"stative-verbs", label:"Verbos estativos", icon:"🧠", color:"amber",
    title:"Stative Verbs", structure:"NO -ing: know / believe / want / love / hate / need / prefer / understand / remember / seem / belong / contain",
    description:"Los verbos estativos describen estados mentales, emociones o sentidos — no acciones. No se usan en tiempos continuos. Error: 'I am knowing' ❌, 'She is wanting' ❌. Algunos como 'think', 'have' y 'see' pueden ser estativos o de acción según el contexto.",
    examples:[
      { english:"I know the answer. ✓ / I am knowing the answer. ✗", highlight:"know", spanish:"Sé la respuesta.", note:"Know = estado mental. No puede estar 'en progreso'." },
      { english:"She wants a new job. ✓ / She is wanting a job. ✗", highlight:"wants", spanish:"Ella quiere un nuevo trabajo.", note:"Want = deseo/estado. No tiene forma continua." },
      { english:"He has a car. ✓ (posesión) / He is having lunch. ✓ (acción)", highlight:"has", spanish:"Tiene un carro. / Está almorzando.", note:"Have puede ser estativo (posesión) o de acción (actividad)." },
      { english:"I think she's right. ✓ / I'm thinking about it. ✓", highlight:"think", spanish:"Creo que tiene razón. / Lo estoy pensando.", note:"Think = opinión (estativo) o proceso activo (continuo). Ambos correctos." },
      { english:"This soup tastes amazing. ✓ / This soup is tasting amazing. ✗", highlight:"tastes", spanish:"Esta sopa sabe increíble.", note:"Taste como percepción = estativo. Sin forma continua." },
    ],
  },
  {
    id:"unless", label:"Unless / As long as", icon:"🔒", color:"teal",
    title:"Unless / As long as / Provided that", structure:"unless + positive clause (= if not) | as long as / provided that + condition",
    description:"Unless = a menos que. Es equivalente a 'if not' — ya incluye la negación (no uses 'unless not'). As long as / provided that = siempre que / con tal de que — ponen una condición para que algo sea posible. Son estructuras condicionales muy usadas en conversación.",
    examples:[
      { english:"Unless you study, you'll fail the exam.", highlight:"Unless", spanish:"A menos que estudies, reprobarás el examen.", note:"Unless = if you don't study. No se dice 'unless you don't study'." },
      { english:"Don't call me unless it's urgent.", highlight:"unless", spanish:"No me llames a menos que sea urgente.", note:"Unless en negativo = la condición para romper la regla." },
      { english:"I'll lend you the money as long as you pay me back.", highlight:"as long as", spanish:"Te prestaré el dinero con tal de que me pagues.", note:"As long as = siempre que se cumpla esa condición." },
      { english:"You can go out, provided that you finish your homework first.", highlight:"provided that", spanish:"Puedes salir, siempre y cuando termines tu tarea primero.", note:"Provided that = as long as. Más formal." },
      { english:"Unless it stops raining, we'll cancel the picnic.", highlight:"Unless it stops", spanish:"A menos que deje de llover, cancelaremos el picnic.", note:"Unless + afirmativo = if it doesn't stop." },
    ],
  },
  {
    id:"both-not-only", label:"Both / Not only", icon:"✌️", color:"rose",
    title:"Both…and / Not only…but also", structure:"both + A + and + B | not only + A + but also + B",
    description:"Both…and = tanto A como B (incluye los dos de forma neutra). Not only…but also = no solo A sino también B (énfasis en el segundo elemento como algo extra o sorprendente). Con 'not only' al inicio, el auxiliar y sujeto invierten su orden.",
    examples:[
      { english:"Both my mother and my father speak English.", highlight:"Both", spanish:"Tanto mi madre como mi padre hablan inglés.", note:"Both…and incluye los dos elementos por igual." },
      { english:"She is both intelligent and hardworking.", highlight:"both intelligent and hardworking", spanish:"Ella es tanto inteligente como trabajadora.", note:"Both…and con adjetivos." },
      { english:"Not only did he apologize, but he also brought flowers.", highlight:"Not only did he", spanish:"No solo se disculpó, sino que también trajo flores.", note:"Not only al inicio → inversión: Not only did he (no 'he did')." },
      { english:"This restaurant is not only cheap but also delicious.", highlight:"not only cheap but also delicious", spanish:"Este restaurante no es solo barato sino también delicioso.", note:"Not only…but also en el medio de la oración." },
      { english:"Both options have their advantages.", highlight:"Both options", spanish:"Ambas opciones tienen sus ventajas.", note:"Both sin 'and' cuando va solo antes del noun." },
    ],
  },
  {
    id:"future-perfect", label:"Future Perfect/Cont.", icon:"🔮", color:"lime",
    title:"Future Perfect & Future Continuous", structure:"will have + past participle | will be + verb-ing",
    description:"Future Perfect = acción que estará completada antes de un momento futuro (habrá + participio). Future Continuous = acción que estará en progreso en un momento futuro (estará + -ando/-iendo). Ambos proyectan al futuro desde el presente.",
    examples:[
      { english:"By the time you arrive, I will have finished cooking.", highlight:"will have finished", spanish:"Para cuando llegues, yo habré terminado de cocinar.", note:"Will have + participio = completado antes de un punto futuro." },
      { english:"By 2030, scientists will have found a cure.", highlight:"will have found", spanish:"Para 2030, los científicos habrán encontrado una cura.", note:"By + future date = Future Perfect." },
      { english:"Don't call at 8 — I'll be having dinner.", highlight:"will be having", spanish:"No llames a las 8 — estaré cenando.", note:"Will be + -ing = en progreso en ese momento futuro." },
      { english:"This time next week, I'll be flying to New York.", highlight:"will be flying", spanish:"A esta hora la semana que viene, estaré volando a Nueva York.", note:"'This time next week/month' → Future Continuous." },
      { english:"By the end of the year, she will have worked here for a decade.", highlight:"will have worked", spanish:"Para finales de año, habrá trabajado aquí por una década.", note:"Future Perfect con duración: will have + worked + for." },
    ],
  },
  {
    id:"adjective-order", label:"Orden de adjetivos", icon:"📋", color:"orange",
    title:"Adjective Order", structure:"opinion → size → age → shape → color → origin → material + noun",
    description:"Cuando hay más de un adjetivo, el inglés sigue un orden fijo. Los nativos lo hacen instintivamente. La regla: opinion (beautiful), size (big), age (old), shape (round), color (red), origin (French), material (wooden). Violar el orden suena muy raro.",
    examples:[
      { english:"A beautiful little old Italian house.", highlight:"beautiful little old Italian", spanish:"Una hermosa casita italiana antigua.", note:"Opinion (beautiful) → size (little) → age (old) → origin (Italian)." },
      { english:"A big black dog.", highlight:"big black", spanish:"Un perro negro grande.", note:"Size (big) → color (black). Nunca 'a black big dog'." },
      { english:"A lovely old French song.", highlight:"lovely old French", spanish:"Una linda canción francesa antigua.", note:"Opinion (lovely) → age (old) → origin (French)." },
      { english:"A small round wooden table.", highlight:"small round wooden", spanish:"Una mesita redonda de madera.", note:"Size (small) → shape (round) → material (wooden)." },
      { english:"An expensive new red sports car.", highlight:"expensive new red", spanish:"Un auto deportivo rojo nuevo y caro.", note:"Opinion (expensive) → age (new) → color (red)." },
    ],
  },
  {
    id:"another-other", label:"Another / Other", icon:"🔄", color:"violet",
    title:"Another vs Other vs Others", structure:"another + singular | other + plural/uncountable | others (pronoun) | the other (el restante)",
    description:"Another = un/una + otro/a (singular, contable, indefinido). Other = otros/as (plural o incontable, siempre con sustantivo). Others = los/las demás (pronombre, sin sustantivo). The other = el/la otro/a específico (cuando solo quedan dos opciones o uno identificado).",
    examples:[
      { english:"Can I have another coffee, please?", highlight:"another", spanish:"¿Puedo tomar otro café, por favor?", note:"Another + singular countable = un/una más (indefinido)." },
      { english:"I have other plans for the weekend.", highlight:"other", spanish:"Tengo otros planes para el fin de semana.", note:"Other + plural noun. No se dice 'another plans'." },
      { english:"Some people liked the movie; others didn't.", highlight:"others", spanish:"A algunas personas les gustó la película; a otras no.", note:"Others = pronombre (sin sustantivo). Los/las demás." },
      { english:"Do you have this shirt in other colors?", highlight:"other colors", spanish:"¿Tienen esta camisa en otros colores?", note:"Other + plural noun." },
      { english:"I have two brothers. One lives in Mexico, the other lives in the US.", highlight:"the other", spanish:"Tengo dos hermanos. Uno vive en México, el otro en EE.UU.", note:"The other = el específico restante cuando solo hay dos." },
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

  // Simple Present
  { sentence:"She ___ English every day.", options:["study","studies","is studying","studied"], correct:"studies", topic:"Simple Present", explanation:"He/she/it en presente simple → verbo + -s/-es. Study → studies." },
  { sentence:"___ your brother work on weekends?", options:["Do","Is","Has","Does"], correct:"Does", topic:"Simple Present", explanation:"Pregunta con he/she/it → Does + subject + base form." },
  { sentence:"I ___ like spicy food.", options:["doesn't","don't","isn't","wasn't"], correct:"don't", topic:"Simple Present", explanation:"Negación con I/you/we/they → don't + base form." },
  { sentence:"Water ___ at 100°C.", options:["is boiling","boiled","boils","boil"], correct:"boils", topic:"Simple Present", explanation:"Hecho científico o verdad universal → simple present. He/she/it + -s." },

  // Articles
  { sentence:"She is ___ engineer.", options:["a","an","the","—"], correct:"an", topic:"Articles", explanation:"'An' antes de sonido vocálico. Engineer empieza con vocal 'e'." },
  { sentence:"Close ___ window, please. (ya sabemos cuál)", options:["a","an","—","the"], correct:"the", topic:"Articles", explanation:"'The' cuando ambos hablantes saben de qué objeto se trata." },
  { sentence:"I saw ___ great movie last night.", options:["the","an","—","a"], correct:"a", topic:"Articles", explanation:"'A' al introducir algo por primera vez. Movie empieza con consonante → a." },
  { sentence:"___ sun is the closest star to Earth.", options:["A","An","—","The"], correct:"The", topic:"Articles", explanation:"'The' con elementos únicos (the sun, the moon, the Earth)." },

  // Frequency Adverbs
  { sentence:"She ___ studies before breakfast.", options:["never","always","sometimes","studies always"], correct:"always", topic:"Frequency Adverbs", explanation:"Adverbios de frecuencia van antes del verbo principal: subject + adverb + verb." },
  { sentence:"He is ___ tired after work.", options:["usually","usually is","is usually","—usually"], correct:"usually", topic:"Frequency Adverbs", explanation:"Con el verbo 'be': subject + be + adverb. He is usually..." },
  { sentence:"___ do you go to the gym?", options:["How many","How much","How often","How long"], correct:"How often", topic:"Frequency Adverbs", explanation:"'How often' pregunta por la frecuencia con que se hace algo." },
  { sentence:"I ___ drink alcohol. (0%)", options:["always","usually","sometimes","never"], correct:"never", topic:"Frequency Adverbs", explanation:"'Never' = 0% de frecuencia. Es negativo por sí mismo." },

  // Comparatives & Superlatives
  { sentence:"This road is ___ than the other one. (largo)", options:["more long","longer","most long","the longest"], correct:"longer", topic:"Comparatives & Superlatives", explanation:"Adjetivo corto (1 sílaba) → + -er + than. Long → longer." },
  { sentence:"This hotel is ___ expensive than the last one.", options:["the most","more","most","much"], correct:"more", topic:"Comparatives & Superlatives", explanation:"Adjetivo largo (3+ sílabas) → more + adj + than." },
  { sentence:"She is ___ student in the class. (superlativo de good)", options:["the better","gooder","the best","the most good"], correct:"the best", topic:"Comparatives & Superlatives", explanation:"Good → better → the best (irregular). Superlativo siempre lleva 'the'." },
  { sentence:"This is ___ movie I've ever seen. (superlativo, adjetivo largo)", options:["the most boring","more boring","the boringest","most boring"], correct:"the most boring", topic:"Comparatives & Superlatives", explanation:"Superlativo de adjetivo largo: the most + adj." },

  // Quantifiers
  { sentence:"There isn't ___ milk left.", options:["some","many","any","few"], correct:"any", topic:"Quantifiers", explanation:"'Any' en oraciones negativas con sustantivos incontables (milk)." },
  { sentence:"She has ___ friends at school. (muchos)", options:["much","a little","many","any"], correct:"many", topic:"Quantifiers", explanation:"'Many' con sustantivos contables en plural (friends)." },
  { sentence:"I don't have ___ time right now.", options:["many","few","some","much"], correct:"much", topic:"Quantifiers", explanation:"'Much' con sustantivos incontables (time) en oraciones negativas." },
  { sentence:"Would you like ___ coffee?", options:["any","many","a few","some"], correct:"some", topic:"Quantifiers", explanation:"'Some' en preguntas amables u ofertas. Coffee es incontable." },

  // Do vs Make
  { sentence:"Can you ___ me a favor?", options:["make","do","have","give"], correct:"do", topic:"Do vs Make", explanation:"'Do a favor' es expresión fija. Do = realizar una acción o servicio." },
  { sentence:"She ___ a big mistake.", options:["did","made","done","make"], correct:"made", topic:"Do vs Make", explanation:"'Make a mistake' es expresión fija. Make = producir un resultado." },
  { sentence:"Don't forget to ___ the dishes after dinner.", options:["make","have","do","take"], correct:"do", topic:"Do vs Make", explanation:"'Do the dishes / homework / cleaning' → tareas domésticas → do." },
  { sentence:"He ___ a phone call every morning.", options:["does","do","makes","has"], correct:"makes", topic:"Do vs Make", explanation:"'Make a phone call / plan / decision' → comunicación o creación → make." },

  // Connectors
  { sentence:"I stayed home ___ it was raining.", options:["so","although","because","even though"], correct:"because", topic:"Connectors", explanation:"'Because' introduce la causa o razón de algo." },
  { sentence:"It was cold, ___ I put on my jacket.", options:["because","although","so","even though"], correct:"so", topic:"Connectors", explanation:"'So' introduce la consecuencia o resultado de algo." },
  { sentence:"She passed the test ___ she didn't study.", options:["because","so","but","even though"], correct:"even though", topic:"Connectors", explanation:"'Even though' expresa contraste sorprendente o inesperado." },
  { sentence:"He is saving money ___ he can buy a car.", options:["because","although","but","so that"], correct:"so that", topic:"Connectors", explanation:"'So that' + subject expresa propósito o intención." },

  // To Be
  { sentence:"___ you from Colombia?", options:["Am","Is","Are","Be"], correct:"Are", topic:"To Be", explanation:"Con you/we/they usamos 'are'." },
  { sentence:"She ___ a doctor at the hospital.", options:["am","are","be","is"], correct:"is", topic:"To Be", explanation:"Con he/she/it usamos 'is'." },
  { sentence:"They ___ not ready yet.", options:["am","is","be","are"], correct:"are", topic:"To Be", explanation:"Con they usamos 'are'. Negativo: are not / aren't." },
  { sentence:"I ___ very happy today.", options:["is","are","be","am"], correct:"am", topic:"To Be", explanation:"Con I siempre usamos 'am'." },

  // There is / There are
  { sentence:"___ a bank near here?", options:["There is","Are there","There are","Is there"], correct:"Is there", topic:"There is/are", explanation:"Pregunta singular: Is there + singular noun?" },
  { sentence:"There ___ three apples on the table.", options:["is","am","be","are"], correct:"are", topic:"There is/are", explanation:"Three apples = plural → There are." },
  { sentence:"There ___ any milk left.", options:["aren't","don't","are","isn't"], correct:"isn't", topic:"There is/are", explanation:"Milk es incontable → singular → There isn't." },
  { sentence:"___ a lot of people at the concert last night.", options:["There is","There are","There were","There was"], correct:"There were", topic:"There is/are", explanation:"Pasado de 'there are' (plural) → There were." },

  // Possessives
  { sentence:"Is this ___ book? (de ella)", options:["hers","his","her","their"], correct:"her", topic:"Possessives", explanation:"Her = adjetivo posesivo (precede al sustantivo). Hers = pronombre." },
  { sentence:"That car is ___. (de nosotros)", options:["our","we","us","ours"], correct:"ours", topic:"Possessives", explanation:"Ours = pronombre posesivo (reemplaza al sustantivo)." },
  { sentence:"The dog hurt ___ paw.", options:["it's","his","their","its"], correct:"its", topic:"Possessives", explanation:"Its = de él/ella para animales/cosas. It's (con apóstrofe) = it is." },
  { sentence:"___ house is bigger than ours. (de ellos)", options:["They","Them","Theirs","Their"], correct:"Their", topic:"Possessives", explanation:"Their = adjetivo posesivo (precede a 'house')." },

  // Demonstratives
  { sentence:"___ shoes over there are very expensive.", options:["This","That","These","Those"], correct:"Those", topic:"Demonstratives", explanation:"Over there = lejos + plural → Those." },
  { sentence:"___ is my best friend. (presentando a alguien cercano)", options:["These","Those","That","This"], correct:"This", topic:"Demonstratives", explanation:"Singular + cercano = This." },
  { sentence:"Are ___ your keys? (cerca, plural)", options:["that","this","those","these"], correct:"these", topic:"Demonstratives", explanation:"Cerca + plural → These." },
  { sentence:"___ building was built in 1900. (lejos, singular)", options:["This","These","Those","That"], correct:"That", topic:"Demonstratives", explanation:"Lejos + singular → That." },

  // Prepositions of Place
  { sentence:"The supermarket is ___ the pharmacy. (al lado)", options:["in front of","between","behind","next to"], correct:"next to", topic:"Prepositions of Place", explanation:"Next to = al lado de." },
  { sentence:"The cat is hiding ___ the sofa. (detrás)", options:["under","in front of","next to","behind"], correct:"behind", topic:"Prepositions of Place", explanation:"Behind = detrás de." },
  { sentence:"The park is ___ the school and the library.", options:["next to","behind","above","between"], correct:"between", topic:"Prepositions of Place", explanation:"Between = entre dos elementos específicos." },
  { sentence:"There's a lamp ___ the table. (encima, sin contacto)", options:["under","below","behind","above"], correct:"above", topic:"Prepositions of Place", explanation:"Above = encima de / por encima de (sin contacto)." },

  // Prepositions of Time
  { sentence:"The class starts ___ 8 o'clock.", options:["on","in","by","at"], correct:"at", topic:"Prepositions of Time", explanation:"At + hora exacta." },
  { sentence:"I was born ___ March.", options:["at","on","by","in"], correct:"in", topic:"Prepositions of Time", explanation:"In + mes, año o estación." },
  { sentence:"She has worked here ___ 2019.", options:["for","at","by","since"], correct:"since", topic:"Prepositions of Time", explanation:"Since + punto de inicio. For + duración." },
  { sentence:"Please send the email ___ Friday.", options:["in","at","since","on"], correct:"on", topic:"Prepositions of Time", explanation:"On + día específico o fecha." },

  // Reflexive Pronouns
  { sentence:"She taught ___ to play the piano.", options:["her","hers","she","herself"], correct:"herself", topic:"Reflexive Pronouns", explanation:"Herself = she es el sujeto y el objeto a la vez." },
  { sentence:"The children made the cake ___. (ellos mismos)", options:["themself","them","theirs","themselves"], correct:"themselves", topic:"Reflexive Pronouns", explanation:"Themselves = ellos mismos, sin ayuda de nadie." },
  { sentence:"Be careful — don't hurt ___.", options:["you","your","yours","yourself"], correct:"yourself", topic:"Reflexive Pronouns", explanation:"Yourself = pronombre reflexivo de you (singular)." },
  { sentence:"He fixed the car by ___.", options:["him","his","he","himself"], correct:"himself", topic:"Reflexive Pronouns", explanation:"By himself = él solo, sin ayuda de nadie." },

  // Tag Questions
  { sentence:"She works here, ___ ?", options:["isn't she","did she","won't she","doesn't she"], correct:"doesn't she", topic:"Tag Questions", explanation:"Simple present positivo + she → tag negativa: doesn't she?" },
  { sentence:"You aren't leaving, ___ ?", options:["aren't you","do you","don't you","are you"], correct:"are you", topic:"Tag Questions", explanation:"Negativo → tag positiva. Aren't (be) → are you." },
  { sentence:"They have met before, ___ ?", options:["have they","did they","don't they","haven't they"], correct:"haven't they", topic:"Tag Questions", explanation:"Present perfect positivo → tag negativa: haven't they?" },
  { sentence:"It was a great movie, ___ ?", options:["isn't it","didn't it","weren't it","wasn't it"], correct:"wasn't it", topic:"Tag Questions", explanation:"Simple past positivo con 'be' → wasn't it?" },

  // Indefinite Pronouns
  { sentence:"___ called you while you were out.", options:["Anyone","Nobody","Nothing","Someone"], correct:"Someone", topic:"Indefinite Pronouns", explanation:"Someone = alguna persona (en afirmaciones)." },
  { sentence:"I didn't see ___ at the party.", options:["someone","nobody","everybody","anyone"], correct:"anyone", topic:"Indefinite Pronouns", explanation:"Anyone en oraciones negativas = nadie / alguien." },
  { sentence:"Is there ___ I can help you with?", options:["something","nothing","nobody","anything"], correct:"anything", topic:"Indefinite Pronouns", explanation:"Anything en preguntas = algo." },
  { sentence:"___ was wrong — everything was perfect.", options:["Something","Anything","Nobody","Nothing"], correct:"Nothing", topic:"Indefinite Pronouns", explanation:"Nothing = nada. Negativo sin 'not' (no se dobla la negación)." },

  // Relative Pronouns
  { sentence:"The man ___ called you is my uncle.", options:["which","whose","where","who"], correct:"who", topic:"Relative Pronouns", explanation:"Who = pronombre relativo para personas." },
  { sentence:"This is the house ___ I grew up.", options:["who","which","that","where"], correct:"where", topic:"Relative Pronouns", explanation:"Where = pronombre relativo para lugares." },
  { sentence:"The student ___ bag was stolen called the police.", options:["who","which","that","whose"], correct:"whose", topic:"Relative Pronouns", explanation:"Whose = posesión. Reemplaza his/her/their." },
  { sentence:"I loved the book ___ you recommended.", options:["who","where","whose","that"], correct:"that", topic:"Relative Pronouns", explanation:"That = que (para cosas o personas, registro informal)." },

  // Already / Yet / Just
  { sentence:"Have you finished your homework ___?", options:["already","just","still","yet"], correct:"yet", topic:"Already/Yet/Just", explanation:"Yet en preguntas va al final. ¿Ya ocurrió lo esperado?" },
  { sentence:"Don't wait for her — she has ___ left.", options:["yet","still","already","just"], correct:"just", topic:"Already/Yet/Just", explanation:"Just = hace muy poco. She has just left = acaba de irse." },
  { sentence:"I have ___ seen that movie. (ya lo vi, antes de lo esperado)", options:["yet","still","just","already"], correct:"already", topic:"Already/Yet/Just", explanation:"Already en afirmaciones → ocurrió antes de lo esperado." },
  { sentence:"She hasn't arrived ___.", options:["already","just","still","yet"], correct:"yet", topic:"Already/Yet/Just", explanation:"Yet en negaciones = todavía no. Va al final de la oración." },

  // Modal Verbs in Past
  { sentence:"You ___ studied more. (era tu responsabilidad)", options:["could have","would have","might have","should have"], correct:"should have", topic:"Modal Verbs in Past", explanation:"Should have + participio = reproche o consejo tardío." },
  { sentence:"I ___ helped you if you had asked me.", options:["should have","must have","might have","could have"], correct:"could have", topic:"Modal Verbs in Past", explanation:"Could have = posibilidad pasada no realizada." },
  { sentence:"She ___ taken the wrong bus. (quizás)", options:["should have","would have","could have","might have"], correct:"might have", topic:"Modal Verbs in Past", explanation:"Might have = suposición incierta sobre el pasado." },
  { sentence:"He ___ called, but he lost his phone.", options:["could have","should have","might have","would have"], correct:"would have", topic:"Modal Verbs in Past", explanation:"Would have + participio = resultado hipotético (3rd conditional)." },

  // Wish
  { sentence:"I wish I ___ more time to travel. (ahora)", options:["have","will have","have had","had"], correct:"had", topic:"Wish", explanation:"Wish + past simple = deseo presente imposible. 'Had', no 'have'." },
  { sentence:"She wishes she ___ fly. (deseo de habilidad)", options:["can","will","would","could"], correct:"could", topic:"Wish", explanation:"Wish + could + base = deseo de una habilidad en el presente." },
  { sentence:"I wish I ___ that. (me arrepiento)", options:["didn't say","don't say","won't say","hadn't said"], correct:"hadn't said", topic:"Wish", explanation:"Wish + past perfect = arrepentimiento por algo en el pasado." },
  { sentence:"I wish you ___ make so much noise.", options:["don't","didn't","won't","wouldn't"], correct:"wouldn't", topic:"Wish", explanation:"Wish + would = deseo de cambio en comportamiento de otro." },

  // Very & Too
  { sentence:"It's ___ cold to go swimming today. (consecuencia negativa)", options:["very","so","quite","too"], correct:"too", topic:"Very & Too", explanation:"Too = exceso con consecuencia negativa. Too cold to swim = imposible." },
  { sentence:"The movie was ___ interesting.", options:["too","too much","enough","very"], correct:"very", topic:"Very & Too", explanation:"Very = intensificador neutro. Sin consecuencia negativa." },
  { sentence:"She is ___ tall to fit in that car.", options:["very","quite","so","too"], correct:"too", topic:"Very & Too", explanation:"Too + adjective + to-infinitivo = exceso que impide hacer algo." },
  { sentence:"He speaks English ___.", options:["very good","too good","too well","very well"], correct:"very well", topic:"Very & Too", explanation:"Very modifica adverbios también. Well es el adverbio de good." },

  // Few vs Little
  { sentence:"I have ___ friends I can really trust. (algunos, positivo)", options:["few","little","a little","a few"], correct:"a few", topic:"Few vs Little", explanation:"A few + contable = algunos (positivo). Friends se puede contar." },
  { sentence:"There is ___ milk left in the fridge. (un poco, positivo)", options:["a few","few","little","a little"], correct:"a little", topic:"Few vs Little", explanation:"A little + incontable = un poco (positivo). Milk no tiene plural." },
  { sentence:"___ people know about this secret. (casi nadie)", options:["A little","Little","A few","Few"], correct:"Few", topic:"Few vs Little", explanation:"Few sin 'a' + contable = casi nadie/nada (negativo). People es contable." },
  { sentence:"We have ___ time before the meeting starts. (casi nada)", options:["a few","few","a little","little"], correct:"little", topic:"Few vs Little", explanation:"Little sin 'a' + incontable = casi nada (negativo). Time es incontable." },

  // Either / Neither
  { sentence:"___ of the two answers is correct. (ninguna)", options:["Either","Both","Any","Neither"], correct:"Neither", topic:"Either / Neither", explanation:"Neither = ninguno de los dos. Verbo singular." },
  { sentence:"You can ___ stay or leave — it's your choice.", options:["neither","both","either","any"], correct:"either", topic:"Either / Neither", explanation:"Either…or = o…o. Presenta dos opciones posibles." },
  { sentence:"\"I can't swim.\" \"___.\" (yo tampoco)", options:["Me too","Me either","Neither can I","So can I"], correct:"Neither can I", topic:"Either / Neither", explanation:"Neither can I = yo tampoco puedo. Responde a una negación." },
  { sentence:"___ the president nor the minister attended the event.", options:["Either","Both","Any","Neither"], correct:"Neither", topic:"Either / Neither", explanation:"Neither…nor = ni…ni. Descarta ambas opciones." },

  // Say vs Tell
  { sentence:"She ___ she was tired. (dijo)", options:["told","said to","said","told to"], correct:"said", topic:"Say vs Tell", explanation:"Say + message sin receptor directo obligatorio." },
  { sentence:"He ___ me to wait outside.", options:["said","said to","told","said me"], correct:"told", topic:"Say vs Tell", explanation:"Tell + person + message. Siempre lleva receptor directo." },
  { sentence:"Can you ___ me the way to the airport?", options:["say","say to","speak","tell"], correct:"tell", topic:"Say vs Tell", explanation:"Tell me = informarme. No se dice 'say me'." },
  { sentence:"Don't ___ lies.", options:["say","speak","do","tell"], correct:"tell", topic:"Say vs Tell", explanation:"Tell a lie / tell the truth → expresiones fijas con 'tell'." },

  // See vs Watch vs Look
  { sentence:"___ at that beautiful painting!", options:["See","Watch","Looks","Look"], correct:"Look", topic:"See/Watch/Look", explanation:"Look at = dirigir la mirada intencionalmente. Acción deliberada." },
  { sentence:"Did you ___ the game last night? (seguiste el partido)", options:["look","see","watch","looked at"], correct:"watch", topic:"See/Watch/Look", explanation:"Watch = seguir algo en movimiento con atención (partidos, películas)." },
  { sentence:"I didn't ___ you come in — I was reading.", options:["watch","look","look at","see"], correct:"see", topic:"See/Watch/Look", explanation:"See = percepción involuntaria. No estaba buscando verlo." },
  { sentence:"She ___ at me and smiled.", options:["saw","watched","looked","see"], correct:"looked", topic:"See/Watch/Look", explanation:"Look at = mirar deliberadamente a alguien. Acción intencional." },

  // Bring vs Take
  { sentence:"___ me that book, please. (tráelo hacia aquí)", options:["Take","Go with","Carry","Bring"], correct:"Bring", topic:"Bring vs Take", explanation:"Bring = traer hacia donde está el hablante." },
  { sentence:"Don't forget to ___ your umbrella when you leave.", options:["bring","come with","carry","take"], correct:"take", topic:"Bring vs Take", explanation:"Take = llevar algo lejos del hablante (tú te vas)." },
  { sentence:"She ___ flowers to the party last night. (llegó con ellas)", options:["took","carried","gave","brought"], correct:"brought", topic:"Bring vs Take", explanation:"Bring = traer hacia un destino compartido. Pasado: brought." },
  { sentence:"Can you ___ the kids to school? (tú los llevas)", options:["bring","come with","carry","take"], correct:"take", topic:"Bring vs Take", explanation:"Take = llevar lejos del punto de partida." },

  // Borrow vs Lend
  { sentence:"Can I ___ your pen? I'll give it back.", options:["lend","give","take","borrow"], correct:"borrow", topic:"Borrow vs Lend", explanation:"Borrow = pedir prestado. Yo soy el receptor." },
  { sentence:"She ___ me her car for the weekend. (ella = dadora)", options:["borrowed","took","gave","lent"], correct:"lent", topic:"Borrow vs Lend", explanation:"Lend = prestar. Ella fue la dadora. Pasado de lend = lent." },
  { sentence:"He ___ money from the bank to buy a house.", options:["lent","gave","borrowed","took"], correct:"borrowed", topic:"Borrow vs Lend", explanation:"Borrow from = pedir prestado a. Él recibió el dinero." },
  { sentence:"Never ___ money you can't afford to lose. (tú = dador)", options:["borrow","take","give","lend"], correct:"lend", topic:"Borrow vs Lend", explanation:"Lend = prestar algo tuyo a otro." },

  // During / While / For
  { sentence:"She fell asleep ___ the lecture. (+ noun)", options:["while","for","as","during"], correct:"during", topic:"During/While/For", explanation:"During + noun. 'The lecture' es un sustantivo." },
  { sentence:"___ I was cooking, the phone rang. (+ clause)", options:["During","For","At","While"], correct:"While", topic:"During/While/For", explanation:"While + clause completa (I was cooking)." },
  { sentence:"He studied ___ five hours without stopping.", options:["during","while","since","for"], correct:"for", topic:"During/While/For", explanation:"For + cantidad de tiempo (five hours)." },
  { sentence:"___ the meeting, nobody said a word. (+ noun phrase)", options:["While","For","As","During"], correct:"During", topic:"During/While/For", explanation:"During + noun phrase. No puede seguirle un sujeto + verbo." },

  // Although / Despite
  { sentence:"___ being tired, she finished the report. (+ -ing)", options:["Although","Even though","Because","Despite"], correct:"Despite", topic:"Although / Despite", explanation:"Despite + -ing. No puede ir seguido de una cláusula completa." },
  { sentence:"___ it was cold, they went swimming. (+ clause)", options:["Despite","In spite of","Because","Although"], correct:"Although", topic:"Although / Despite", explanation:"Although + clause completa (it was cold)." },
  { sentence:"She passed ___ not studying at all.", options:["although","because","even though","despite"], correct:"despite", topic:"Although / Despite", explanation:"Despite + -ing. In spite of también sería correcto." },
  { sentence:"He arrived on time ___ the traffic was terrible.", options:["despite","in spite of","because","even though"], correct:"even though", topic:"Although / Despite", explanation:"Even though + clause (the traffic was terrible). Contraste sorpresivo." },

  // Also / Too / Either
  { sentence:"I like jazz. My friend likes it ___. (final, afirmativo)", options:["either","also","neither","too"], correct:"too", topic:"Also / Too / Either", explanation:"Too al final de oraciones afirmativas." },
  { sentence:"She ___ speaks German and French. (antes del verbo)", options:["too","either","neither","also"], correct:"also", topic:"Also / Too / Either", explanation:"Also antes del verbo principal. Posición formal." },
  { sentence:"I can't swim. — I can't ___. (negativo)", options:["too","also","neither","either"], correct:"either", topic:"Also / Too / Either", explanation:"Either al final de oraciones negativas = yo tampoco." },
  { sentence:"He is ___ a great writer. (después de be)", options:["too","either","neither","also"], correct:"also", topic:"Also / Too / Either", explanation:"Also va después del verbo be o auxiliar." },

  // So vs Such
  { sentence:"The film was ___ boring that I left early.", options:["such","such a","so much","so"], correct:"so", topic:"So vs Such", explanation:"So + adjective. Boring es adjetivo." },
  { sentence:"It was ___ long day that I went straight to bed.", options:["so","so a","so much","such a"], correct:"such a", topic:"So vs Such", explanation:"Such a + adjective + noun. Siempre 'such a/an' antes del noun." },
  { sentence:"She speaks ___ quickly that nobody understands.", options:["such","such a","so a","so"], correct:"so", topic:"So vs Such", explanation:"So + adverb (quickly)." },
  { sentence:"He has ___ good memory.", options:["so","so a","so good a","such a"], correct:"such a", topic:"So vs Such", explanation:"Such a + adjective + noun (memory es un sustantivo)." },

  // Miss / Lose / Fail
  { sentence:"I ___ the bus by two minutes. (no llegué a tiempo)", options:["lost","failed","left","missed"], correct:"missed", topic:"Miss / Lose / Fail", explanation:"Miss = no alcanzar algo por llegar tarde." },
  { sentence:"He ___ his wallet somewhere in the city.", options:["missed","failed","left","lost"], correct:"lost", topic:"Miss / Lose / Fail", explanation:"Lose = dejar de tener algo que tenías." },
  { sentence:"She ___ her driving test twice before passing.", options:["missed","lost","left","failed"], correct:"failed", topic:"Miss / Lose / Fail", explanation:"Fail = no pasar una prueba o no lograr algo." },
  { sentence:"Don't ___ this chance — it won't come again.", options:["lose","fail","leave","miss"], correct:"miss", topic:"Miss / Lose / Fail", explanation:"Miss = no aprovechar algo disponible." },

  // False Friends
  { sentence:"___, I think you're right. (en realidad)", options:["Currently","Lately","Truly","Actually"], correct:"Actually", topic:"Falsos amigos", explanation:"Actually = en realidad / de hecho. NOT actualmente → currently." },
  { sentence:"She is very ___ — she always considers other people's feelings.", options:["sensible","sensational","sensory","sensitive"], correct:"sensitive", topic:"Falsos amigos", explanation:"Sensitive = sensible emocionalmente. Sensible = sensato/prudente." },
  { sentence:"He was ___ when he forgot her birthday.", options:["embarrassing","pregnant","ashamed","embarrassed"], correct:"embarrassed", topic:"Falsos amigos", explanation:"Embarrassed = avergonzado/a. Embarrassed ≠ embarazada." },
  { sentence:"The problem will ___ be solved.", options:["actually","currently","possibly","eventually"], correct:"eventually", topic:"Falsos amigos", explanation:"Eventually = tarde o temprano / finalmente. NOT eventualmente → possibly." },

  // Know vs Meet
  { sentence:"Nice to ___ you! I've heard so much about you.", options:["know","see","find","meet"], correct:"meet", topic:"Know vs Meet", explanation:"Nice to meet you = primer encuentro. Solo se dice la primera vez." },
  { sentence:"Do you ___ that woman? Is she your neighbor?", options:["meet","find","see","know"], correct:"know", topic:"Know vs Meet", explanation:"Know = ¿tienes relación con ella? No es primer encuentro." },
  { sentence:"We ___ for coffee every Friday morning.", options:["know","find","see","meet"], correct:"meet", topic:"Know vs Meet", explanation:"Meet = reunirse / quedar con alguien regularmente." },
  { sentence:"I've ___ her for years — she's an old friend.", options:["met","saw","found","known"], correct:"known", topic:"Know vs Meet", explanation:"Have known = presente perfecto de know. Relación de larga data." },

  // Causative
  { sentence:"My boss ___ me work overtime every Friday.", options:["let","got","had","made"], correct:"made", topic:"Make/Let/Get/Have", explanation:"Make + person + base = obligar sin opción de negarse." },
  { sentence:"My parents ___ me stay out until midnight.", options:["made","got","had","let"], correct:"let", topic:"Make/Let/Get/Have", explanation:"Let + person + base = permitir." },
  { sentence:"I'll ___ someone to fix the pipe.", options:["make","have","let","get"], correct:"get", topic:"Make/Let/Get/Have", explanation:"Get + person + to-inf = convencer o encargar." },
  { sentence:"She ___ her hair cut at the salon.", options:["made","got","let","had"], correct:"had", topic:"Make/Let/Get/Have", explanation:"Have + object + past participle = encargar un servicio." },

  // Used to
  { sentence:"He ___ smoke a pack a day, but he quit.", options:["is used to","gets used to","use to","used to"], correct:"used to", topic:"Used to", explanation:"Used to + base = hábito pasado que ya no ocurre." },
  { sentence:"Are you ___ waking up early?", options:["used to","use to","getting to","used to be"], correct:"used to", topic:"Used to", explanation:"Be used to + -ing = estar acostumbrado (estado presente)." },
  { sentence:"It takes time to ___ a new culture.", options:["used to","be used to","use to","get used to"], correct:"get used to", topic:"Used to", explanation:"Get used to + -ing = proceso de adaptación." },
  { sentence:"She ___ live in Paris, but she moved to London.", options:["is used to","gets used to","use to","used to"], correct:"used to", topic:"Used to", explanation:"Used to + base = estado pasado que ya no es actual." },

  // Would Rather / Had Better
  { sentence:"I'd ___ stay home than go to that party.", options:["better","sooner","prefer","rather"], correct:"rather", topic:"Would Rather / Had Better", explanation:"Would rather + base verb (+ than) = preferir." },
  { sentence:"You'd ___ call him now — he's been waiting all day.", options:["rather","prefer","more","better"], correct:"better", topic:"Would Rather / Had Better", explanation:"Had better = más vale que. Advertencia de consecuencia negativa." },
  { sentence:"Would you ___ have coffee or tea?", options:["better","prefer","sooner","rather"], correct:"rather", topic:"Would Rather / Had Better", explanation:"Would rather en pregunta = ¿qué prefieres?" },
  { sentence:"We'd ___ leave early or we'll miss the flight.", options:["rather","prefer","sooner","better"], correct:"better", topic:"Would Rather / Had Better", explanation:"Had better + or + consecuencia = urgencia fuerte." },

  // -ing vs -ed adjectives
  { sentence:"The presentation was so ___. (causa aburrimiento)", options:["bored","bore","to bore","boring"], correct:"boring", topic:"-ing vs -ed adj.", explanation:"-ing describe la presentación. Ella causa aburrimiento." },
  { sentence:"I was completely ___ by the news.", options:["shocking","shock","to shock","shocked"], correct:"shocked", topic:"-ing vs -ed adj.", explanation:"-ed describe cómo me sentí YO al recibir el impacto." },
  { sentence:"That was a very ___ lecture.", options:["interested","interest","to interest","interesting"], correct:"interesting", topic:"-ing vs -ed adj.", explanation:"-ing: la clase despierta interés. Ella tiene esa cualidad." },
  { sentence:"He looked ___ when he heard the results.", options:["disappointing","disappoint","to disappoint","disappointed"], correct:"disappointed", topic:"-ing vs -ed adj.", explanation:"-ed: él se sintió decepcionado. Estado emocional de la persona." },

  // Stative Verbs
  { sentence:"She ___ the answer right now.", options:["is knowing","know","has knowing","knows"], correct:"knows", topic:"Verbos estativos", explanation:"Know es estativo — no tiene forma continua." },
  { sentence:"I ___ to go home right now.", options:["am wanting","wanted","wants","want"], correct:"want", topic:"Verbos estativos", explanation:"Want es estativo. No se dice 'I am wanting'." },
  { sentence:"This milk ___ bad.", options:["is tasting","tastes","taste","has tasted"], correct:"tastes", topic:"Verbos estativos", explanation:"Taste como percepción = estativo. Forma simple." },
  { sentence:"I ___ what you mean — it's very clear.", options:["am understanding","understanding","have understood","understand"], correct:"understand", topic:"Verbos estativos", explanation:"Understand es estativo. No tiene forma continua." },

  // Unless
  { sentence:"___ you study, you'll fail.", options:["If","When","Although","Unless"], correct:"Unless", topic:"Unless / As long as", explanation:"Unless = if you don't. Ya incluye la negación." },
  { sentence:"I won't go ___ you invite me personally.", options:["if","although","when","unless"], correct:"unless", topic:"Unless / As long as", explanation:"Unless = if you don't invite me." },
  { sentence:"You can use my car ___ you bring it back by 6.", options:["unless","although","if not","as long as"], correct:"as long as", topic:"Unless / As long as", explanation:"As long as = siempre que se cumpla esa condición." },
  { sentence:"Don't call me ___ it's an emergency.", options:["although","if","when","unless"], correct:"unless", topic:"Unless / As long as", explanation:"Unless = a menos que. La única razón para llamar." },

  // Both / Not only
  { sentence:"___ my sister and my brother live abroad.", options:["Either","Neither","Not only","Both"], correct:"Both", topic:"Both / Not only", explanation:"Both…and = tanto A como B. Incluye los dos." },
  { sentence:"Not only is she talented, ___ she works very hard.", options:["but","and also","or also","but also"], correct:"but also", topic:"Both / Not only", explanation:"Not only…but also. La segunda parte introduce algo extra." },
  { sentence:"Not only ___ he apologize, but he also brought gifts.", options:["he did","has he","he has","did he"], correct:"did he", topic:"Both / Not only", explanation:"Not only al inicio → inversión auxiliar/sujeto: did he." },
  { sentence:"___ options have advantages and disadvantages.", options:["Neither","Either","Not only","Both"], correct:"Both", topic:"Both / Not only", explanation:"Both (sin 'and') antes de noun = ambos/as." },

  // Future Perfect / Continuous
  { sentence:"By the time you arrive, I ___ cooking.", options:["will finish","am finishing","finish","will have finished"], correct:"will have finished", topic:"Future Perfect/Cont.", explanation:"Will have + participio = completado antes de un punto futuro." },
  { sentence:"Don't call at 8 — I ___ dinner.", options:["will have dinner","will","will have had","will be having"], correct:"will be having", topic:"Future Perfect/Cont.", explanation:"Will be + -ing = en progreso en ese momento futuro." },
  { sentence:"By 2030, scientists ___ a cure.", options:["find","will find","found","will have found"], correct:"will have found", topic:"Future Perfect/Cont.", explanation:"By + future date → Future Perfect: will have + participio." },
  { sentence:"This time next week, she ___ on a plane.", options:["flies","will fly","will have flown","will be flying"], correct:"will be flying", topic:"Future Perfect/Cont.", explanation:"'This time next week' → Future Continuous: will be + -ing." },

  // Adjective Order
  { sentence:"Which is correct?", options:["a French old beautiful house","a old beautiful French house","an old French beautiful house","a beautiful old French house"], correct:"a beautiful old French house", topic:"Orden de adjetivos", explanation:"Opinion (beautiful) → age (old) → origin (French)." },
  { sentence:"Which is correct?", options:["a black big dog","a big dog black","a dog big black","a big black dog"], correct:"a big black dog", topic:"Orden de adjetivos", explanation:"Size (big) → color (black). Nunca 'a black big dog'." },
  { sentence:"Which is correct?", options:["a wooden small round table","a round small wooden table","a small wooden round table","a small round wooden table"], correct:"a small round wooden table", topic:"Orden de adjetivos", explanation:"Size (small) → shape (round) → material (wooden)." },
  { sentence:"She bought ___ dress for the party.", options:["a red lovely long","a long red lovely","a lovely long red","a red long lovely"], correct:"a lovely long red", topic:"Orden de adjetivos", explanation:"Opinion (lovely) → size (long) → color (red)." },

  // Another / Other / Others
  { sentence:"Can I have ___ piece of cake? (una más)", options:["other","the other","others","another"], correct:"another", topic:"Another / Other", explanation:"Another + singular countable = un/una más (indefinido)." },
  { sentence:"Some students passed; ___ failed. (pronombre)", options:["other","the other","another","others"], correct:"others", topic:"Another / Other", explanation:"Others = pronombre (sin sustantivo). Los/las demás." },
  { sentence:"I have ___ plans for the weekend. (+ plural noun)", options:["another","others","the other","other"], correct:"other", topic:"Another / Other", explanation:"Other + plural noun. No 'another plans' (another es singular)." },
  { sentence:"I have two brothers. One is a teacher; ___ is a doctor.", options:["other","others","another","the other"], correct:"the other", topic:"Another / Other", explanation:"The other = el específico restante cuando solo hay dos." },
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
