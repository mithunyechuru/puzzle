// Puzzle Quest Question Database
// Contains questions for Puzzle A and Puzzle B (25 items each, covering up to 5x5 grids)

const puzzleA = [
  {
    id: "pa1",
    category: "Tech",
    difficulty: "Easy",
    text: "What does HTML stand for?",
    options: [
      "Hypertext Markup Language",
      "Hyperlink and Text Markup Language",
      "Home Tool Markup Language",
      "Hypertech Modern Makeup Language"
    ],
    correctAnswer: 0
  },
  {
    id: "pa2",
    category: "Logic",
    difficulty: "Medium",
    text: "A doctor gives you 3 pills and tells you to take one every half hour. How long do they last?",
    options: ["1 hour", "1.5 hours", "2 hours", "30 minutes"],
    correctAnswer: 0
  },
  {
    id: "pa3",
    category: "Cyberpunk",
    difficulty: "Easy",
    text: "Which iconic 1982 sci-fi film features a 'replicant hunter' named Rick Deckard?",
    options: ["Blade Runner", "The Matrix", "Tron", "Total Recall"],
    correctAnswer: 0
  },
  {
    id: "pa4",
    category: "Web Dev",
    difficulty: "Medium",
    text: "Which CSS property is essential to construct modern backdrop blur glassmorphism?",
    options: ["backdrop-filter", "background-blend-mode", "filter", "box-shadow"],
    correctAnswer: 0
  },
  {
    id: "pa5",
    category: "Tech",
    difficulty: "Easy",
    text: "What is the main language used for writing structure and interactivity in Next.js projects?",
    options: ["TypeScript/JavaScript", "Python", "Ruby on Rails", "C++"],
    correctAnswer: 0
  },
  {
    id: "pa6",
    category: "Sci-Fi",
    difficulty: "Medium",
    text: "What is the name of the sentient, rogue AI in the film '2001: A Space Odyssey'?",
    options: ["HAL 9000", "G.L.A.D.O.S.", "Skynet", "W.O.P.R."],
    correctAnswer: 0
  },
  {
    id: "pa7",
    category: "Logic",
    difficulty: "Easy",
    text: "If you break me, I do not stop working. What am I?",
    options: ["A promise", "A mirror", "A clock", "A glass cup"],
    correctAnswer: 0
  },
  {
    id: "pa8",
    category: "Cyberpunk",
    difficulty: "Medium",
    text: "In classic cyberpunk lore, what is the colloquial term for a netrunner's interface computer?",
    options: ["Cyberdeck", "Neural Link", "Data Rig", "mainframe Box"],
    correctAnswer: 0
  },
  {
    id: "pa9",
    category: "Web Dev",
    difficulty: "Easy",
    text: "Which built-in React hook is standard for handling state variables in a component?",
    options: ["useState", "useEffect", "useRef", "useMemo"],
    correctAnswer: 0
  },
  {
    id: "pa10",
    category: "Tech",
    difficulty: "Hard",
    text: "Which network protocol is optimized for full-duplex, real-time communication over a single TCP connection?",
    options: ["WebSocket", "HTTP/1.1", "FTP", "gRPC over HTTP/1.0"],
    correctAnswer: 0
  },
  {
    id: "pa11",
    category: "Sci-Fi",
    difficulty: "Medium",
    text: "What is the speed rating required to travel through time in 'Back to the Future'?",
    options: ["88 miles per hour", "120 miles per hour", "Speed of sound", "Speed of light"],
    correctAnswer: 0
  },
  {
    id: "pa12",
    category: "Logic",
    difficulty: "Medium",
    text: "What has keys but open no locks, with space but no room, and allows you to enter but not go in?",
    options: ["A keyboard", "A map", "A piano", "A combination dial"],
    correctAnswer: 0
  },
  {
    id: "pa13",
    category: "Cyberpunk",
    difficulty: "Hard",
    text: "Who wrote the seminal 1984 cyberpunk novel 'Neuromancer', introducing the term 'cyberspace'?",
    options: ["William Gibson", "Philip K. Dick", "Neal Stephenson", "Bruce Sterling"],
    correctAnswer: 0
  },
  {
    id: "pa14",
    category: "Web Dev",
    difficulty: "Easy",
    text: "In CSS, what is the default display value of a <div> element?",
    options: ["block", "inline", "inline-block", "flex"],
    correctAnswer: 0
  },
  {
    id: "pa15",
    category: "Tech",
    difficulty: "Medium",
    text: "Which data structure operates on a 'First In, First Out' (FIFO) basis?",
    options: ["Queue", "Stack", "Binary Tree", "Hash Map"],
    correctAnswer: 0
  },
  {
    id: "pa16",
    category: "Sci-Fi",
    difficulty: "Hard",
    text: "In Frank Herbert's 'Dune', what is the native name of the planet Dune?",
    options: ["Arrakis", "Caladan", "Giedi Prime", "Salusa Secundus"],
    correctAnswer: 0
  },
  {
    id: "pa17",
    category: "Logic",
    difficulty: "Hard",
    text: "I am light as a feather, yet the strongest person cannot hold me for much more than five minutes. What am I?",
    options: ["Breath", "Air", "Water", "A shadow"],
    correctAnswer: 0
  },
  {
    id: "pa18",
    category: "Web Dev",
    difficulty: "Medium",
    text: "Which Tailwind CSS class is used to apply transition-duration of 300ms?",
    options: ["duration-300", "transition-300", "ease-300", "delay-300"],
    correctAnswer: 0
  },
  {
    id: "pa19",
    category: "Cyberpunk",
    difficulty: "Easy",
    text: "In the movie 'The Matrix', what color pill does Neo take to wake up in the real world?",
    options: ["Red", "Blue", "Green", "Yellow"],
    correctAnswer: 0
  },
  {
    id: "pa20",
    category: "Tech",
    difficulty: "Medium",
    text: "What is the standard port number used for secure HTTPS connections?",
    options: ["443", "80", "8080", "22"],
    correctAnswer: 0
  },
  {
    id: "pa21",
    category: "General",
    difficulty: "Easy",
    text: "Which company created the JavaScript programming language?",
    options: ["Netscape", "Microsoft", "Sun Microsystems", "Oracle"],
    correctAnswer: 0
  },
  {
    id: "pa22",
    category: "Sci-Fi",
    difficulty: "Medium",
    text: "Which spaceship was piloted by Han Solo in Star Wars?",
    options: ["Millennium Falcon", "Enterprise", "Serenity", "Galactica"],
    correctAnswer: 0
  },
  {
    id: "pa23",
    category: "Tech",
    difficulty: "Hard",
    text: "What is the time complexity of searching in a perfectly balanced Binary Search Tree?",
    options: ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
    correctAnswer: 0
  },
  {
    id: "pa24",
    category: "Logic",
    difficulty: "Easy",
    text: "What comes down but never goes up?",
    options: ["Rain", "Temperature", "Age", "A balloon"],
    correctAnswer: 0
  },
  {
    id: "pa25",
    category: "Cyberpunk",
    difficulty: "Hard",
    text: "In the game Cyberpunk 2077, what is the name of the protagonist?",
    options: ["V", "Johnny Silverhand", "Jackie Welles", "Judy Alvarez"],
    correctAnswer: 0
  }
];

const puzzleB = [
  {
    id: "pb1",
    category: "Tech",
    difficulty: "Easy",
    text: "Which programming language is known as the language of the web?",
    options: ["JavaScript", "Python", "Java", "C++"],
    correctAnswer: 0
  },
  {
    id: "pb2",
    category: "Logic",
    difficulty: "Medium",
    text: "If a giraffe has two eyes, a monkey has two eyes, and an elephant has two eyes, how many eyes do we have?",
    options: ["4", "6", "2", "8"],
    correctAnswer: 2
  },
  {
    id: "pb3",
    category: "Cyberpunk",
    difficulty: "Easy",
    text: "In the movie 'Blade Runner 2049', who plays the lead character Officer K?",
    options: ["Ryan Gosling", "Harrison Ford", "Jared Leto", "Robin Wright"],
    correctAnswer: 0
  },
  {
    id: "pb4",
    category: "Web Dev",
    difficulty: "Medium",
    text: "What does the 'CSS' abbreviation stand for?",
    options: ["Cascading Style Sheets", "Creative Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
    correctAnswer: 0
  },
  {
    id: "pb5",
    category: "Tech",
    difficulty: "Easy",
    text: "What command in Git is used to copy an existing repository?",
    options: ["git clone", "git fork", "git copy", "git init"],
    correctAnswer: 0
  },
  {
    id: "pb6",
    category: "Sci-Fi",
    difficulty: "Medium",
    text: "Who wrote the famous science fiction novel 'Fahrenheit 451'?",
    options: ["Ray Bradbury", "Arthur C. Clarke", "Isaac Asimov", "Philip K. Dick"],
    correctAnswer: 0
  },
  {
    id: "pb7",
    category: "Logic",
    difficulty: "Easy",
    text: "What goes up but never comes down?",
    options: ["Your age", "Rain", "A kite", "An elevator"],
    correctAnswer: 0
  },
  {
    id: "pb8",
    category: "Cyberpunk",
    difficulty: "Medium",
    text: "What is the name of the futuristic megacity in Cyberpunk 2077?",
    options: ["Night City", "Mega City One", "Neo-Seoul", "Chiba City"],
    correctAnswer: 0
  },
  {
    id: "pb9",
    category: "Web Dev",
    difficulty: "Easy",
    text: "Which HTML tag is used to create a hyperlink?",
    options: ["<a>", "<link>", "<href>", "<url>"],
    correctAnswer: 0
  },
  {
    id: "pb10",
    category: "Tech",
    difficulty: "Hard",
    text: "What protocol is primary used to resolve a domain name into an IP address?",
    options: ["DNS", "DHCP", "FTP", "SSH"],
    correctAnswer: 0
  },
  {
    id: "pb11",
    category: "Sci-Fi",
    difficulty: "Medium",
    text: "What is the primary power source for the time machine in Back to the Future?",
    options: ["Flux Capacitor", "Fusion Reactor", "Plutonium", "Dilithium Crystals"],
    correctAnswer: 2
  },
  {
    id: "pb12",
    category: "Logic",
    difficulty: "Medium",
    text: "Mary's father has five daughters: Nana, Nene, Nini, Nono. What is the fifth daughter's name?",
    options: ["Mary", "Nunu", "Nono", "Nini"],
    correctAnswer: 0
  },
  {
    id: "pb13",
    category: "Cyberpunk",
    difficulty: "Hard",
    text: "In Neal Stephenson's Snow Crash, what is the name of the virtual reality metaverse?",
    options: ["The Metaverse", "The Net", "Cyberspace", "The Grid"],
    correctAnswer: 0
  },
  {
    id: "pb14",
    category: "Web Dev",
    difficulty: "Easy",
    text: "Which CSS layout module allows easy design of flexible responsive layout structure?",
    options: ["Flexbox", "Grid", "Float", "Block"],
    correctAnswer: 0
  },
  {
    id: "pb15",
    category: "Tech",
    difficulty: "Medium",
    text: "Which SQL command is used to fetch data from a database?",
    options: ["SELECT", "GET", "FETCH", "EXTRACT"],
    correctAnswer: 0
  },
  {
    id: "pb16",
    category: "Sci-Fi",
    difficulty: "Hard",
    text: "What are the three laws governing robots in Isaac Asimov's science fiction?",
    options: ["Three Laws of Robotics", "Robot Principles", "Asimov's Codex", "The Machine Rules"],
    correctAnswer: 0
  },
  {
    id: "pb17",
    category: "Logic",
    difficulty: "Hard",
    text: "If you have me, you want to share me. If you share me, you haven't got me. What am I?",
    options: ["A secret", "A coin", "A key", "A joke"],
    correctAnswer: 0
  },
  {
    id: "pb18",
    category: "Web Dev",
    difficulty: "Medium",
    text: "What hook in React is used to execute side effects in function components?",
    options: ["useEffect", "useState", "useContext", "useReducer"],
    correctAnswer: 0
  },
  {
    id: "pb19",
    category: "Cyberpunk",
    difficulty: "Easy",
    text: "In cyberpunk genre, what does 'corpo' stand for?",
    options: ["Corporate worker/agent", "Corporal", "Corporeal", "Corpse"],
    correctAnswer: 0
  },
  {
    id: "pb20",
    category: "Tech",
    difficulty: "Medium",
    text: "What port number is standard for unsecured HTTP protocol?",
    options: ["80", "443", "8080", "21"],
    correctAnswer: 0
  },
  {
    id: "pb21",
    category: "General",
    difficulty: "Easy",
    text: "Who is credited with creating the World Wide Web?",
    options: ["Tim Berners-Lee", "Bill Gates", "Steve Jobs", "Alan Turing"],
    correctAnswer: 0
  },
  {
    id: "pb22",
    category: "Sci-Fi",
    difficulty: "Medium",
    text: "What is the designation of the main ship in the TV show Star Trek: The Next Generation?",
    options: ["USS Enterprise NCC-1701-D", "USS Voyager", "USS Defiant", "USS Discovery"],
    correctAnswer: 0
  },
  {
    id: "pb23",
    category: "Tech",
    difficulty: "Hard",
    text: "Which encryption algorithm uses a public key and a private key pair?",
    options: ["RSA", "AES", "DES", "Blowfish"],
    correctAnswer: 0
  },
  {
    id: "pb24",
    category: "Logic",
    difficulty: "Easy",
    text: "What belongs to you, but other people use it more than you do?",
    options: ["Your name", "Your phone", "Your key", "Your seat"],
    correctAnswer: 0
  },
  {
    id: "pb25",
    category: "Cyberpunk",
    difficulty: "Hard",
    text: "Who wrote the 1975 sci-fi novel 'The Shockwave Rider', which predicted computer worms?",
    options: ["John Brunner", "William Gibson", "Philip K. Dick", "Bruce Sterling"],
    correctAnswer: 0
  }
];

module.exports = {
  puzzleA,
  puzzleB
};
