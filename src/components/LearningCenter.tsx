import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  category: 'Fundamentals' | 'Loom Mechanics' | 'Plans & Drafting' | 'Weave Structures';
  readTime: string;
  summary: string;
  content: string[];
  keyTerms: { term: string; definition: string }[];
  interactiveMini: {
    description: string;
    defaultMatrix: number[][];
    taskQuestion: string;
    targetPattern: string;
  };
}

const LESSONS: Lesson[] = [
  {
    id: 'what-is-dobby',
    title: '1. What is a Dobby Loom?',
    category: 'Loom Mechanics',
    readTime: '3 min',
    summary: 'The evolutionary bridge between standard 2-4 shaft handlooms and complex Jacquard machines.',
    content: [
      'In traditional handweaving, treadle looms use foot pedals to lift shafts. But human legs can comfortably control only 4 to 8 treadles at once.',
      'A Dobby (derived from "draw boy", the apprentice who used to sit atop handlooms pulling cords) is a mechanical attachment that automates shaft lifting using a rotating wooden lattice (lag) embedded with wooden or metal pegs.',
      'By inserting pegs into the lattice rows according to a technical lifting plan, a weaver can command 8, 16, 24, or even 32 independent heald shafts with a single foot pedal or hand lever!'
    ],
    keyTerms: [
      { term: 'Dobby Mechanism', definition: 'Mechanical apparatus atop or beside the handloom that selects and lifts combinations of heald shafts automatically.' },
      { term: 'Lattice / Lag', definition: 'Hinged wooden slats linked like a tank tread, drilled with holes to receive pegs.' },
      { term: 'Peg', definition: 'Small wooden or metal pin inserted into a lattice hole. A peg present lifts the corresponding heald shaft.' }
    ],
    interactiveMini: {
      description: 'Click pegs to toggle shaft lifting for Pick 1. Observe how the shed opens.',
      defaultMatrix: [
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1]
      ],
      taskQuestion: 'Configure Pick 1 so all even shafts (2, 4, 6, 8) are raised.',
      targetPattern: 'even-shafts'
    }
  },
  {
    id: 'warp-and-weft',
    title: '2. Warp, Weft & Interlacement',
    category: 'Fundamentals',
    readTime: '3 min',
    summary: 'The two orthogonal yarn systems that create every woven fabric on Earth.',
    content: [
      'Warp: The longitudinal threads held under high tension lengthwise on the loom, wound onto the back warp beam.',
      'Weft (or Filling/Woof): The horizontal yarn carried back and forth across the warp threads inside a flying or hand shuttle.',
      'Interlacement: Fabric is created solely by passing the weft thread over some warp threads and under others. On a weave graph, a filled square conventionally represents WARP UP (warp floating over weft).'
    ],
    keyTerms: [
      { term: 'Warp End', definition: 'An individual vertical yarn running the entire length of the loom.' },
      { term: 'Weft Pick', definition: 'A single crosswise passage of the weft yarn through the open shed.' },
      { term: 'Shed', definition: 'The temporary triangular opening formed when some warp ends are lifted while others remain down.' }
    ],
    interactiveMini: {
      description: 'Toggle cells to create a 1/1 Plain Weave interlacement (checkerboard).',
      defaultMatrix: [
        [1, 0, 1, 0],
        [0, 1, 0, 1],
        [1, 0, 1, 0],
        [0, 1, 0, 1]
      ],
      taskQuestion: 'Ensure no two adjacent warp threads or weft picks float together.',
      targetPattern: 'plain'
    }
  },
  {
    id: 'epi-and-ppi',
    title: '3. EPI, PPI & Cover Factor',
    category: 'Fundamentals',
    readTime: '4 min',
    summary: 'How thread density dictates fabric weight, transparency, and motif distortion.',
    content: [
      'EPI (Ends Per Inch): The number of warp threads spaced per inch across the width of the reed.',
      'PPI (Picks Per Inch): The number of weft threads beaten into the cloth per inch along its length.',
      'Square Construction: When EPI equals PPI (e.g. 48×48), geometric motifs like circles and 45° diamonds weave symmetrically. If EPI is 60 and PPI is 40, your motif will compress vertically by 33%!'
    ],
    keyTerms: [
      { term: 'Reed & Denting', definition: 'The comb-like steel frame on the beater. Denting is how many ends pass per slot (dent).' },
      { term: 'Aspect Distortion', definition: 'The physical geometric stretch caused by unequal EPI and PPI counts.' }
    ],
    interactiveMini: {
      description: 'Observe the 4x4 diamond. Notice how changing density alters its woven proportions.',
      defaultMatrix: [
        [0, 1, 1, 0],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [0, 1, 1, 0]
      ],
      taskQuestion: 'Calculate the aspect ratio when EPI is 48 and PPI is 48 (Answer: 1.00x).',
      targetPattern: 'diamond'
    }
  },
  {
    id: 'shafts-and-drafting',
    title: '4. Shafts, Healds & Drafting Plans',
    category: 'Plans & Drafting',
    readTime: '5 min',
    summary: 'The secret architecture: How every single warp thread is threaded through a specific heald eye.',
    content: [
      'Every warp end must pass through the eye of a wire or string heald suspended in a shaft frame.',
      'Drafting Plan (Drawing-in Plan): Tells the weaver which shaft each warp end must be threaded through.',
      'Straight Draft: Warp end 1 goes to Shaft 1, end 2 to Shaft 2, end 3 to Shaft 3, etc.',
      'Pointed Draft: Shafts are threaded 1-2-3-4-3-2-1, creating symmetrical diamond twills with half the shafts!',
      'Minimum Reduction: Any two warp ends that have identical lifting behavior throughout the entire repeat can share the exact same heald shaft!'
    ],
    keyTerms: [
      { term: 'Heald Wire / Eye', definition: 'A fine steel wire with a central loop (eye) through which one warp thread is threaded.' },
      { term: 'Drafting Plan', definition: 'Technical diagram showing warp end to heald shaft assignments.' }
    ],
    interactiveMini: {
      description: 'Identify unique columns in this 4x4 weave to determine the minimum shafts required.',
      defaultMatrix: [
        [1, 0, 1, 0],
        [0, 1, 0, 1],
        [1, 0, 1, 0],
        [0, 1, 0, 1]
      ],
      taskQuestion: 'Columns 1 and 3 are identical; Columns 2 and 4 are identical. How many shafts needed? (Answer: 2)',
      targetPattern: 'two-shafts'
    }
  },
  {
    id: 'floats-and-faults',
    title: '5. Yarn Floats & Structural Integrity',
    category: 'Weave Structures',
    readTime: '4 min',
    summary: 'Why excessive yarn floats ruin handwoven fabrics and how to fix them.',
    content: [
      'A Float occurs whenever a warp thread travels over multiple weft picks without interlacing, or vice-versa.',
      'Short Floats (2 to 4 threads): Ideal for twills, satins, and smooth surface luster.',
      'Excessive Floats (> 6 threads): Very dangerous in handlooms! The long unbound threads snag on jewelry, buckle during washing, and create weak spots in the garment.',
      'Binder Points: Skilled dobby designers insert tiny ground interlacements (twill or plain tie-downs) to anchor long floats without disrupting the motif.'
    ],
    keyTerms: [
      { term: 'Warp Float', definition: 'Consecutive picks where the warp yarn floats on the face of the cloth.' },
      { term: 'Snagging', definition: 'Accidental catching and pulling of long loose threads during daily wear.' }
    ],
    interactiveMini: {
      description: 'Fix this long 6-pick float by adding a center tie-down interlacement.',
      defaultMatrix: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1]
      ],
      taskQuestion: 'Click two central cells to insert binder interlacements.',
      targetPattern: 'fixed-float'
    }
  }
];

export const LearningCenter: React.FC = () => {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);
  const [activeTaskCompleted, setActiveTaskCompleted] = useState<boolean>(false);

  const activeLesson = LESSONS.find(l => l.id === selectedLessonId) || LESSONS[0];

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#121622] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Weaver Learning Center</h2>
            <p className="text-xs text-slate-400">
              Interactive fundamentals of handloom dobby weaving, drafting plans, and weave math
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          5 Interactive Masterclasses
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Lesson Navigation Sidebar */}
        <div className="lg:col-span-4 bg-[#11141f] border-r border-slate-800 p-4 overflow-y-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">
            Curriculum Modules
          </span>

          {LESSONS.map(lesson => (
            <button
              key={lesson.id}
              onClick={() => {
                setSelectedLessonId(lesson.id);
                setActiveTaskCompleted(false);
              }}
              className={`w-full p-3.5 rounded-xl text-left transition-all flex items-start justify-between border ${
                lesson.id === selectedLessonId
                  ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-md'
                  : 'bg-[#090b10] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-0.5">
                  {lesson.category} • {lesson.readTime}
                </span>
                <h4 className="text-xs font-bold line-clamp-1">{lesson.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{lesson.summary}</p>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                  lesson.id === selectedLessonId ? 'text-amber-400 translate-x-1' : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Right Lesson Reader & Interactive Practice Task */}
        <div className="lg:col-span-8 bg-[#0a0c12] p-6 overflow-y-auto space-y-6">
          {/* Lesson Header */}
          <div className="pb-4 border-b border-slate-800">
            <span className="text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider">
              {activeLesson.category}
            </span>
            <h1 className="text-xl font-bold text-white mt-1">{activeLesson.title}</h1>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeLesson.summary}</p>
          </div>

          {/* Lesson Body Paragraphs */}
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-[#11141f] p-5 rounded-2xl border border-slate-800 shadow-xl">
            {activeLesson.content.map((p, idx) => (
              <p key={idx} className="flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                <span>{p}</span>
              </p>
            ))}
          </div>

          {/* Key Terms Glossary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Essential Textile Terminology
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeLesson.keyTerms.map(term => (
                <div
                  key={term.term}
                  className="p-3 bg-[#11141f] rounded-xl border border-slate-800 text-xs space-y-1"
                >
                  <strong className="text-amber-300 font-bold block">{term.term}</strong>
                  <p className="text-slate-400 text-[11px]">{term.definition}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Mini-Loom Practice Task */}
          <div className="p-5 bg-gradient-to-br from-[#121622] to-[#1a2030] rounded-2xl border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Interactive Practice Challenge
                </h4>
              </div>
              {activeTaskCompleted && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  Task Completed!
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200">{activeLesson.interactiveMini.taskQuestion}</p>

            {/* Interactive Grid Sandbox */}
            <div className="flex flex-col items-center p-4 bg-[#090b10] rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono text-slate-400">
                {activeLesson.interactiveMini.description}
              </span>

              <div className="flex flex-col gap-1 p-2 bg-[#161922] rounded-lg border border-slate-700">
                {activeLesson.interactiveMini.defaultMatrix.map((row, r) => (
                  <div key={r} className="flex gap-1">
                    {row.map((val, c) => (
                      <button
                        key={c}
                        onClick={() => setActiveTaskCompleted(true)}
                        className={`w-7 h-7 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                          val === 1
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {val === 1 ? 'W' : ''}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTaskCompleted(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                Verify Solution
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
