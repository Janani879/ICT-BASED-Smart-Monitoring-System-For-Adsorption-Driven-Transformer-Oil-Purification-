import { useState, useMemo } from "react";
import { 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  Trash2, 
  AlertTriangle, 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Sparkles,
  Layers,
  Activity,
  ChevronDown,
  ChevronUp,
  Bot,
  X,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, Customized } from "recharts";
import MetricCard from "@/components/MetricCard";
import {
  CalculatedSample,
  Point2D,
  zoneColors,
  zoneNames,
  pd_poly,
  d1_poly,
  d2_poly,
  dt_poly,
  t1_poly,
  t2_poly,
  t3_poly,
  toCartesian,
  parseCSVData,
  getSampleExplanation
} from "@/lib/dga";


// ==========================================
// 2. RECHARTS TRIANGLE BACKGROUND DRAWING
// ==========================================

interface TriangleProps {
  xAxisMap?: Array<{ scale: (val: number) => number }>;
  yAxisMap?: Array<{ scale: (val: number) => number }>;
  xAxis?: { scale: (val: number) => number };
  yAxis?: { scale: (val: number) => number };
}

const DuvalTriangleBackground = (props: TriangleProps) => {
  const xAxis = props.xAxisMap?.[0] || props.xAxis;
  const yAxis = props.yAxisMap?.[0] || props.yAxis;
  if (!xAxis || !yAxis) return null;

  const scaleX = xAxis.scale;
  const scaleY = yAxis.scale;

  const getPointsString = (poly: Point2D[]) => {
    return poly.map(pt => `${scaleX(pt.x)},${scaleY(pt.y)}`).join(" ");
  };

  return (
    <g>
      {/* Background Zones */}
      <polygon points={getPointsString(pd_poly)} fill={zoneColors["PD"]} fillOpacity={0.25} stroke="#444" strokeWidth={1} />
      <polygon points={getPointsString(d1_poly)} fill={zoneColors["D1"]} fillOpacity={0.25} stroke="#444" strokeWidth={1} />
      <polygon points={getPointsString(d2_poly)} fill={zoneColors["D2"]} fillOpacity={0.25} stroke="#444" strokeWidth={1} />
      <polygon points={getPointsString(dt_poly)} fill={zoneColors["DT"]} fillOpacity={0.25} stroke="#444" strokeWidth={1} />
      <polygon points={getPointsString(t1_poly)} fill={zoneColors["T1"]} fillOpacity={0.25} stroke="#444" strokeWidth={1} />
      <polygon points={getPointsString(t2_poly)} fill={zoneColors["T2"]} fillOpacity={0.25} stroke="#444" strokeWidth={1} />
      <polygon points={getPointsString(t3_poly)} fill={zoneColors["T3"]} fillOpacity={0.25} stroke="#444" strokeWidth={1} />
      
      {/* Triangle outer boundary */}
      <polygon 
        points={`${scaleX(0)},${scaleY(0)} ${scaleX(100)},${scaleY(0)} ${scaleX(50)},${scaleY(86.6025)}`}
        fill="none" 
        stroke="rgba(255,255,255,0.4)" 
        strokeWidth={2} 
      />

      {/* Vertex Labels */}
      <text x={scaleX(50)} y={scaleY(86.6025) - 12} textAnchor="middle" fill="#888" className="text-[10px] font-bold uppercase tracking-wider">
        100% CH4 (Methane)
      </text>
      <text x={scaleX(0) - 25} y={scaleY(0) + 18} textAnchor="start" fill="#888" className="text-[10px] font-bold uppercase tracking-wider">
        100% C2H4 (Ethylene)
      </text>
      <text x={scaleX(100) + 25} y={scaleY(0) + 18} textAnchor="end" fill="#888" className="text-[10px] font-bold uppercase tracking-wider">
        100% C2H2 (Acetylene)
      </text>
    </g>
  );
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { sampleNum: number; pctCh4: number; pctC2h4: number; pctC2h2: number; duvalZone: string } }>;
}

// Custom tooltip for point hover
const CustomChartTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border/80 rounded-xl p-3 text-xs leading-normal shadow-xl space-y-1 text-foreground">
        <div className="font-bold text-primary font-mono">Sample #{data.sampleNum}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-muted-foreground">Methane (CH4):</span>
          <span className="font-mono text-right">{data.pctCh4.toFixed(1)}%</span>
          <span className="text-muted-foreground">Ethylene (C2H4):</span>
          <span className="font-mono text-right">{data.pctC2h4.toFixed(1)}%</span>
          <span className="text-muted-foreground">Acetylene (C2H2):</span>
          <span className="font-mono text-right">{data.pctC2h2.toFixed(1)}%</span>
          <span className="text-muted-foreground font-semibold mt-1">Duval Zone:</span>
          <span className="font-semibold text-right mt-1" style={{ color: zoneColors[data.duvalZone] }}>
            {data.duvalZone}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

const DgaFaultAnalysisPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [calculatedData, setCalculatedData] = useState<CalculatedSample[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Table search, sort, pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof CalculatedSample | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Focus / highlight selected point
  const [selectedSampleNum, setSelectedSampleNum] = useState<number | null>(null);

  // Local card explanation toggles
  const [rogersSimple, setRogersSimple] = useState(false);
  const [iecSimple, setIecSimple] = useState(false);
  const [duvalSimple, setDuvalSimple] = useState(false);

  // Expandable Diagnostic Interpretation Section States
  const [isInterpretationExpanded, setIsInterpretationExpanded] = useState(true);
  const [interpretationMode, setInterpretationMode] = useState<'expert' | 'simple' | 'comparison'>('expert');

  // Floating Chat Assistant States
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'assistant' | 'user', text: string }>>([
    { sender: 'assistant', text: "Hello! I am your Ask DGA Assistant. I help translate complex transformer diagnostics and thermodynamics into simple, everyday analogies." },
    { sender: 'assistant', text: "How can I help you today? Feel free to use one of the quick prompt buttons below!" }
  ]);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragOver(true);
    } else if (e.type === "dragleave") {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setErrorMessage(null);
    setSelectedSampleNum(null);
    setRogersSimple(false);
    setIecSimple(false);
    setDuvalSimple(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVData(text);
        setCalculatedData(parsed);
        setCurrentPage(1);
      } catch (err) {
        const error = err as Error;
        setErrorMessage(error.message || "An error occurred while parsing the CSV file.");
        setCalculatedData([]);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Could not read the uploaded CSV file.");
      setCalculatedData([]);
    };
    reader.readAsText(file);
  };

  const removeDataset = () => {
    setFileName(null);
    setCalculatedData([]);
    setErrorMessage(null);
    setSelectedSampleNum(null);
    setRogersSimple(false);
    setIecSimple(false);
    setDuvalSimple(false);
    setChatHistory([
      { sender: 'assistant', text: "Hello! I am your Ask DGA Assistant. I help translate complex transformer diagnostics and thermodynamics into simple, everyday analogies." },
      { sender: 'assistant', text: "How can I help you today? Feel free to use one of the quick prompt buttons below!" }
    ]);
  };


  // Distributions & Counts
  const distributions = useMemo(() => {
    const total = calculatedData.length;
    if (total === 0) return null;

    // Rogers distribution counts
    const rogersCounts: Record<string, number> = {};
    // IEC distribution counts
    const iecCounts: Record<string, number> = {};
    // Duval distribution counts
    const duvalCounts: Record<string, number> = {
      "PD": 0, "D1": 0, "D2": 0, "DT": 0, "T1": 0, "T2": 0, "T3": 0
    };

    calculatedData.forEach(item => {
      rogersCounts[item.rogersFault] = (rogersCounts[item.rogersFault] || 0) + 1;
      iecCounts[item.iecFault] = (iecCounts[item.iecFault] || 0) + 1;
      duvalCounts[item.duvalZone] = (duvalCounts[item.duvalZone] || 0) + 1;
    });

    return {
      total,
      rogers: Object.entries(rogersCounts).map(([name, val]) => ({ name, val, pct: (val / total) * 100 })),
      iec: Object.entries(iecCounts).map(([name, val]) => ({ name, val, pct: (val / total) * 100 })),
      duval: Object.entries(duvalCounts).map(([name, val]) => ({ name, val, pct: (val / total) * 100 }))
    };
  }, [calculatedData]);

  // Handle table filtering & sorting
  const sortedAndFilteredData = useMemo(() => {
    let result = [...calculatedData];

    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.sampleNum.toString().includes(lower) ||
        item.rogersFault.toLowerCase().includes(lower) ||
        item.iecFault.toLowerCase().includes(lower) ||
        item.duvalZone.toLowerCase().includes(lower)
      );
    }

    // Apply sort
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === undefined || valB === undefined) return 0;
        
        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }
        return sortDirection === "asc" 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [calculatedData, searchTerm, sortColumn, sortDirection]);

  // Paginated Rows
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedAndFilteredData.slice(startIndex, startIndex + pageSize);
  }, [sortedAndFilteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedAndFilteredData.length / pageSize);

  const handleSort = (column: keyof CalculatedSample) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Export files handler
  const handleExportCSV = () => {
    if (calculatedData.length === 0) return;

    const headers = [
      "Sample", "H2", "CH4", "C2H6", "C2H4", "C2H2",
      "Rogers R1 (CH4/H2)", "Rogers R2 (C2H6/CH4)", "Rogers R3 (C2H4/C2H6)", "Rogers R4 (C2H2/C2H4)", "Rogers Diagnosis",
      "IEC I1 (C2H2/C2H4)", "IEC I2 (CH4/H2)", "IEC I3 (C2H4/C2H6)", "IEC Diagnosis",
      "Duval Sum", "Duval CH4 %", "Duval C2H4 %", "Duval C2H2 %", "Duval Zone"
    ];

    const rows = calculatedData.map(item => [
      item.sampleNum,
      item.h2,
      item.ch4,
      item.c2h6,
      item.c2h4,
      item.c2h2,
      item.h2 === 0 ? "N/A" : item.r1.toFixed(3),
      item.ch4 === 0 ? "N/A" : item.r2.toFixed(3),
      item.c2h6 === 0 ? "N/A" : item.r3.toFixed(3),
      item.c2h4 === 0 ? "N/A" : item.r4.toFixed(3),
      item.rogersFault,
      item.c2h4 === 0 ? "N/A" : item.i1.toFixed(3),
      item.h2 === 0 ? "N/A" : item.i2.toFixed(3),
      item.c2h6 === 0 ? "N/A" : item.i3.toFixed(3),
      item.iecFault,
      item.sumDuval,
      item.pctCh4.toFixed(1),
      item.pctC2h4.toFixed(1),
      item.pctC2h2.toFixed(1),
      item.duvalZone
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DGA_Fault_Analysis_${fileName?.replace(".csv", "") || "Export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (calculatedData.length === 0) return;

    const headers = [
      "Sample", "H2", "CH4", "C2H6", "C2H4", "C2H2",
      "Rogers R1", "Rogers R2", "Rogers R3", "Rogers R4", "Rogers Fault",
      "IEC I1", "IEC I2", "IEC I3", "IEC Fault",
      "Duval Sum", "Duval CH4 %", "Duval C2H4 %", "Duval C2H2 %", "Duval Zone"
    ];

    const rows = calculatedData.map(item => `
      <tr>
        <td>${item.sampleNum}</td>
        <td>${item.h2}</td>
        <td>${item.ch4}</td>
        <td>${item.c2h6}</td>
        <td>${item.c2h4}</td>
        <td>${item.c2h2}</td>
        <td>${item.h2 === 0 ? "N/A" : item.r1.toFixed(3)}</td>
        <td>${item.ch4 === 0 ? "N/A" : item.r2.toFixed(3)}</td>
        <td>${item.c2h6 === 0 ? "N/A" : item.r3.toFixed(3)}</td>
        <td>${item.c2h4 === 0 ? "N/A" : item.r4.toFixed(3)}</td>
        <td>${item.rogersFault}</td>
        <td>${item.c2h4 === 0 ? "N/A" : item.i1.toFixed(3)}</td>
        <td>${item.h2 === 0 ? "N/A" : item.i2.toFixed(3)}</td>
        <td>${item.c2h6 === 0 ? "N/A" : item.i3.toFixed(3)}</td>
        <td>${item.iecFault}</td>
        <td>${item.sumDuval}</td>
        <td>${item.pctCh4.toFixed(1)}%</td>
        <td>${item.pctC2h4.toFixed(1)}%</td>
        <td>${item.pctC2h2.toFixed(1)}%</td>
        <td>${item.duvalZone}</td>
      </tr>
    `).join("");

    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>DGA Fault Analysis</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #1e3a8a; color: #ffffff; font-weight: bold;">
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DGA_Fault_Analysis_${fileName?.replace(".csv", "") || "Spreadsheet"}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find the details of currently selected sample
  const selectedSample = useMemo(() => {
    if (selectedSampleNum === null) return null;
    return calculatedData.find(item => item.sampleNum === selectedSampleNum) || null;
  }, [selectedSampleNum, calculatedData]);

  // Generate technical & ELI5 explanations dynamically for selected sample
  const explanation = useMemo(() => {
    if (!selectedSample) return null;
    return getSampleExplanation(selectedSample);
  }, [selectedSample]);

  // Chat Prompt click handler
  const handleChatPrompt = (prompt: string) => {
    // 1. Add user message
    setChatHistory(prev => [...prev, { sender: 'user', text: prompt }]);

    // 2. Generate response with realistic brief typing delay
    setTimeout(() => {
      let replyText = "";
      if (prompt.startsWith("Explain in Simple Words")) {
        setInterpretationMode('simple');
        setRogersSimple(true);
        setIecSimple(true);
        setDuvalSimple(true);
        replyText = "I've toggled Simple Mode (ELI5) across the entire dashboard! All technical explanations have been translated into clear analogies (such as 'static electrical leaks' and 'red-hot toaster wires'). Let me know if you need anything else simplified!";
      } else if (prompt.startsWith("Show side-by-side comparison")) {
        setInterpretationMode('comparison');
        setIsInterpretationExpanded(true);
        replyText = "I have updated the Expert Diagnostic Interpretation section to 'Comparison View'. You can now view the technical engineering description side-by-side with the simple analogies.";
      } else if (prompt.startsWith("Explain Selected Sample")) {
        if (!selectedSample) {
          replyText = "No sample is currently selected. Please click on any row in the results table or any point on the Duval Triangle, and I'll translate its diagnosis simply!";
        } else {
          const sampleExplanation = getSampleExplanation(selectedSample);
          replyText = `Here is the simple breakdown for Sample #${selectedSample.sampleNum} (classified as Rogers: ${selectedSample.rogersFault}, Duval Zone: ${selectedSample.duvalZone}):\n\n`
            + `• Overall Assessment: ${sampleExplanation.overall.simple}\n\n`
            + `• Recommendations: ${sampleExplanation.recommendations.simple}\n\n`
            + `• Duval Triangle Explanation: ${sampleExplanation.duval.simple}\n\n`
            + `• Rogers Ratio Explanation: ${sampleExplanation.rogers.simple}`;
        }
      } else if (prompt.includes("Duval Triangle")) {
        replyText = "The Duval Triangle 1 is a special map that uses three gases: Methane (CH4), Ethylene (C2H4), and Acetylene (C2H2).\n\n"
          + "Analogy: Think of it like checking what is cooking in the kitchen. If you smell mild butter warming up, the stove is just warm (T1/T2). If you smell severe smoke and charred toast, the heat is extremely high (T3). If there's a quick spark that catches fire, it's like electrical sparking (D1/D2). The triangle calculates the exact mixture recipe to find the defect on the map!";
      } else if (prompt.includes("Rogers Ratios")) {
        replyText = "Rogers Ratios work like chemical clues! Instead of looking at raw gas numbers, we compare them in pairs (e.g., Methane vs. Hydrogen).\n\n"
          + "Analogy: If Methane is way higher than Hydrogen, something is getting hot without sparking. If Acetylene is high compared to Ethylene, a high-voltage spark (arcing) occurred. By checking these ratios, we decode a secret combination that tells us exactly what fault is happening inside.";
      } else {
        replyText = "I am ready to help. Please use one of the quick prompt buttons to simplify the explanations.";
      }

      setChatHistory(prev => [...prev, { sender: 'assistant', text: replyText }]);
    }, 400);
  };

  // Gather plot data for scatter
  const scatterPoints = useMemo(() => {
    return calculatedData.map(item => ({
      x: item.chartX,
      y: item.chartY,
      sampleNum: item.sampleNum,
      pctCh4: item.pctCh4,
      pctC2h4: item.pctC2h4,
      pctC2h2: item.pctC2h2,
      duvalZone: item.duvalZone,
      color: zoneColors[item.duvalZone]
    }));
  }, [calculatedData]);

  return (
    <div className="space-y-6">
      
      {/* Top Section: Upload & Triangle Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Upload / Details Card */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Card 1: Upload */}
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <UploadCloud size={20} className="text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">Upload DGA Dataset</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Drag & Drop dissolved gas concentrations (ppm)</p>
              </div>
            </div>

            {errorMessage && (
              <div className="flex gap-2 text-xs p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive leading-relaxed items-start">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Validation Error</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {!fileName ? (
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group min-h-[180px] ${
                  dragOver 
                    ? "border-primary bg-primary/5 scale-[0.99]" 
                    : "border-border/80 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
                }`}
              >
                <input 
                  type="file" 
                  id="csv-file-picker" 
                  accept=".csv" 
                  onChange={handleFileInput} 
                  className="hidden" 
                />
                <label htmlFor="csv-file-picker" className="cursor-pointer flex flex-col items-center gap-3">
                  <UploadCloud size={32} className={`transition-transform duration-200 group-hover:-translate-y-1 ${
                    dragOver ? "text-primary scale-110" : "text-muted-foreground"
                  }`} />
                  <div>
                    <span className="btn-secondary inline-flex px-3 py-1.5 text-xs font-semibold mb-2">Browse File</span>
                    <p className="text-xs text-muted-foreground">Supports CSV files containing columns: <b className="text-foreground">H2, CH4, C2H6, C2H4, C2H2</b></p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="panel-block flex flex-col justify-between gap-4 p-4 min-h-[140px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 overflow-hidden">
                    <span className="label-uppercase block">Uploaded Dataset</span>
                    <h3 className="text-sm font-semibold text-foreground truncate">{fileName}</h3>
                    <p className="text-xs text-muted-foreground">Total records parsed: <b className="text-foreground font-mono">{calculatedData.length}</b></p>
                  </div>
                  <button 
                    onClick={removeDataset}
                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg text-muted-foreground transition-colors shrink-0"
                    title="Remove file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <label htmlFor="csv-file-picker" className="btn-secondary w-full text-xs font-semibold py-2 justify-center cursor-pointer text-center">
                    <input 
                      type="file" 
                      id="csv-file-picker" 
                      accept=".csv" 
                      onChange={handleFileInput} 
                      className="hidden" 
                    />
                    Upload Different File
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Interactive Diagnostic Focus details */}
          <AnimatePresence mode="wait">
            {selectedSample ? (
              <motion.div
                key={selectedSample.sampleNum}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="surface-card p-6 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-primary" />
                    <h3 className="font-semibold text-sm">Sample #{selectedSample.sampleNum} Diagnostics</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedSampleNum(null)} 
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear selection
                  </button>
                </div>

                {/* Grid of Results */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Rogers Method result */}
                  <div className="surface-metric p-3 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-border/20 pb-1.5 mb-1.5">
                      <span className="label-uppercase text-[9px] font-bold text-muted-foreground">Rogers Ratio Method</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRogersSimple(prev => !prev); }}
                        className="text-[9px] text-primary hover:underline font-semibold flex items-center gap-0.5 whitespace-nowrap"
                      >
                        <Sparkles size={8} />
                        {rogersSimple ? "Show Expert" : "Explain Simply"}
                      </button>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground mb-1 leading-snug">
                        {selectedSample.rogersFault}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono space-x-1.5 bg-background/40 px-1.5 py-0.5 rounded border border-border/10 inline-block mb-1">
                        <span>R1:{selectedSample.h2 === 0 ? "N/A" : selectedSample.r1.toFixed(2)}</span>
                        <span>R2:{selectedSample.ch4 === 0 ? "N/A" : selectedSample.r2.toFixed(2)}</span>
                        <span>R3:{selectedSample.c2h6 === 0 ? "N/A" : selectedSample.r3.toFixed(2)}</span>
                        <span>R4:{selectedSample.c2h4 === 0 ? "N/A" : selectedSample.r4.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-muted-foreground mt-1 border-t border-border/10 pt-1 font-sans">
                        {rogersSimple ? explanation?.rogers.simple : explanation?.rogers.expert}
                      </p>
                    </div>
                  </div>

                  {/* IEC Method result */}
                  <div className="surface-metric p-3 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-border/20 pb-1.5 mb-1.5">
                      <span className="label-uppercase text-[9px] font-bold text-muted-foreground">IEC Ratio Method</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIecSimple(prev => !prev); }}
                        className="text-[9px] text-primary hover:underline font-semibold flex items-center gap-0.5 whitespace-nowrap"
                      >
                        <Sparkles size={8} />
                        {iecSimple ? "Show Expert" : "Explain Simply"}
                      </button>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground mb-1 leading-snug">
                        {selectedSample.iecFault}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono space-x-1.5 bg-background/40 px-1.5 py-0.5 rounded border border-border/10 inline-block mb-1">
                        <span>I1:{selectedSample.c2h4 === 0 ? "N/A" : selectedSample.i1.toFixed(2)}</span>
                        <span>I2:{selectedSample.h2 === 0 ? "N/A" : selectedSample.i2.toFixed(2)}</span>
                        <span>I3:{selectedSample.c2h6 === 0 ? "N/A" : selectedSample.i3.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-muted-foreground mt-1 border-t border-border/10 pt-1 font-sans">
                        {iecSimple ? explanation?.iec.simple : explanation?.iec.expert}
                      </p>
                    </div>
                  </div>

                  {/* Duval result */}
                  <div className="col-span-2 surface-metric p-3 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-border/20 pb-1.5 mb-1.5">
                      <span className="label-uppercase text-[9px] font-bold text-muted-foreground">Duval Triangle 1</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDuvalSimple(prev => !prev); }}
                        className="text-[9px] text-primary hover:underline font-semibold flex items-center gap-0.5 whitespace-nowrap"
                      >
                        <Sparkles size={8} />
                        {duvalSimple ? "Show Expert" : "Explain Simply"}
                      </button>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs font-bold leading-none" style={{ color: zoneColors[selectedSample.duvalZone] }}>
                          Zone {selectedSample.duvalZone} — {zoneNames[selectedSample.duvalZone]}
                        </div>
                        <div 
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: zoneColors[selectedSample.duvalZone] }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono space-x-2 bg-background/40 px-1.5 py-0.5 rounded border border-border/10 inline-block mb-1">
                        <span>CH4: {selectedSample.pctCh4.toFixed(1)}%</span>
                        <span>C2H4: {selectedSample.pctC2h4.toFixed(1)}%</span>
                        <span>C2H2: {selectedSample.pctC2h2.toFixed(1)}%</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-muted-foreground mt-1 border-t border-border/10 pt-1 font-sans">
                        {duvalSimple ? explanation?.duval.simple : explanation?.duval.expert}
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              <div className="surface-card p-6 min-h-[180px] flex flex-col items-center justify-center text-center text-muted-foreground">
                <Info size={24} className="mb-2 text-muted-foreground/60" />
                <p className="text-xs max-w-xs leading-relaxed">
                  {calculatedData.length > 0 
                    ? "Click on any row in the results table below to inspect its ratios and diagnostics details."
                    : "Awaiting DGA CSV file upload to view diagnostics and fault classifications."
                  }
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Expert Diagnostic Interpretation expandable section */}
          <AnimatePresence>
            {selectedSample && explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="surface-card p-6 space-y-4 overflow-hidden border border-primary/20 bg-primary/5"
              >
                <div 
                  className="flex items-center justify-between border-b border-border pb-3 cursor-pointer"
                  onClick={() => setIsInterpretationExpanded(prev => !prev)}
                >
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-primary animate-pulse" />
                    <h3 className="font-bold text-sm text-foreground">Expert Diagnostic Interpretation</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isInterpretationExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isInterpretationExpanded && (
                  <div className="space-y-4">
                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-background/50 p-2 rounded-xl border border-border/40 text-[10px] gap-2">
                      <span className="font-semibold text-muted-foreground font-sans uppercase tracking-wider text-[9px]">Diagnostic Language Mode:</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setInterpretationMode('expert')}
                          className={`px-2 py-0.5 rounded transition-all font-semibold uppercase tracking-wider text-[9px] ${
                            interpretationMode === 'expert' 
                              ? "bg-primary text-primary-foreground shadow" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Expert Mode
                        </button>
                        <button 
                          onClick={() => setInterpretationMode('simple')}
                          className={`px-2 py-0.5 rounded transition-all font-semibold uppercase tracking-wider text-[9px] ${
                            interpretationMode === 'simple' 
                              ? "bg-primary text-primary-foreground shadow" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Simple Mode (ELI5)
                        </button>
                        <button 
                          onClick={() => setInterpretationMode('comparison')}
                          className={`px-2 py-0.5 rounded transition-all font-semibold uppercase tracking-wider text-[9px] ${
                            interpretationMode === 'comparison' 
                              ? "bg-primary text-primary-foreground shadow" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Comparison
                        </button>
                      </div>
                    </div>

                    {/* Interpretation Content */}
                    {interpretationMode !== 'comparison' ? (
                      <div className="space-y-4 text-xs leading-relaxed">
                        
                        {/* Overall health assessment */}
                        <div className="p-3.5 rounded-xl border border-border/40 bg-secondary/30">
                          <h4 className="font-bold text-[10px] uppercase text-primary mb-1.5 tracking-wider">Overall Health Assessment</h4>
                          <p className="text-foreground">
                            {interpretationMode === 'expert' ? explanation.overall.expert : explanation.overall.simple}
                          </p>
                        </div>

                        {/* Recommendations */}
                        <div className="p-3.5 rounded-xl border border-border/40 bg-secondary/30">
                          <h4 className="font-bold text-[10px] uppercase text-primary mb-1.5 tracking-wider">Asset Management Recommendations</h4>
                          <p className="text-foreground">
                            {interpretationMode === 'expert' ? explanation.recommendations.expert : explanation.recommendations.simple}
                          </p>
                        </div>

                        {/* Ratios explainers */}
                        <div className="grid grid-cols-1 gap-3">
                          <div className="p-3.5 rounded-xl border border-border/30 bg-background/40">
                            <h5 className="font-bold text-[9px] uppercase text-muted-foreground mb-1 tracking-wider">Rogers Ratio Analysis</h5>
                            <p className="text-muted-foreground font-sans">
                              {interpretationMode === 'expert' ? explanation.rogers.expert : explanation.rogers.simple}
                            </p>
                          </div>
                          
                          <div className="p-3.5 rounded-xl border border-border/30 bg-background/40">
                            <h5 className="font-bold text-[9px] uppercase text-muted-foreground mb-1 tracking-wider">IEC Ratio Analysis</h5>
                            <p className="text-muted-foreground font-sans">
                              {interpretationMode === 'expert' ? explanation.iec.expert : explanation.iec.simple}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl border border-border/30 bg-background/40">
                            <h5 className="font-bold text-[9px] uppercase text-muted-foreground mb-1 tracking-wider">Duval Triangle 1 Context</h5>
                            <p className="text-muted-foreground font-sans">
                              {interpretationMode === 'expert' ? explanation.duval.expert : explanation.duval.simple}
                            </p>
                          </div>
                        </div>

                      </div>
                    ) : (
                      // Comparison View: side-by-side
                      <div className="space-y-4 text-xs leading-normal">
                        <div className="grid grid-cols-2 gap-4 border-b border-border pb-2 font-bold uppercase text-[9px] tracking-wider text-muted-foreground">
                          <div>Expert Technical Interpretation</div>
                          <div>Simple ELI5 Explanation</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 border-b border-border/20 pb-3">
                          <div className="font-medium text-foreground bg-background/30 p-2.5 rounded-xl border border-border/15">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">Overall Health Assessment</span>
                            {explanation.overall.expert}
                          </div>
                          <div className="text-muted-foreground bg-secondary/20 p-2.5 rounded-xl border border-border/10">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">Overall Health Assessment</span>
                            {explanation.overall.simple}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-b border-border/20 pb-3">
                          <div className="font-medium text-foreground bg-background/30 p-2.5 rounded-xl border border-border/15">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">Recommendations</span>
                            {explanation.recommendations.expert}
                          </div>
                          <div className="text-muted-foreground bg-secondary/20 p-2.5 rounded-xl border border-border/10">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">Recommendations</span>
                            {explanation.recommendations.simple}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-b border-border/20 pb-3">
                          <div className="text-muted-foreground bg-background/30 p-2.5 rounded-xl border border-border/15">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">Rogers Ratio Analysis</span>
                            {explanation.rogers.expert}
                          </div>
                          <div className="text-muted-foreground bg-secondary/20 p-2.5 rounded-xl border border-border/10">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">Rogers Ratio Analysis</span>
                            {explanation.rogers.simple}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-b border-border/20 pb-3">
                          <div className="text-muted-foreground bg-background/30 p-2.5 rounded-xl border border-border/15">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">IEC Ratio Analysis</span>
                            {explanation.iec.expert}
                          </div>
                          <div className="text-muted-foreground bg-secondary/20 p-2.5 rounded-xl border border-border/10">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">IEC Ratio Analysis</span>
                            {explanation.iec.simple}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-muted-foreground bg-background/30 p-2.5 rounded-xl border border-border/15">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">Duval Triangle 1 Context</span>
                            {explanation.duval.expert}
                          </div>
                          <div className="text-muted-foreground bg-secondary/20 p-2.5 rounded-xl border border-border/10">
                            <span className="block font-bold text-[9px] uppercase text-primary mb-1 tracking-wider">Duval Triangle 1 Context</span>
                            {explanation.duval.simple}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        

        {/* Right Column: Duval Triangle Plot */}
        <div className="xl:col-span-7 surface-card p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-3">
              <Layers size={20} className="text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">Duval Triangle 1 Visualization</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ternary plot projection of Methane, Ethylene, and Acetylene</p>
              </div>
            </div>
            
            {/* Zone Legends */}
            <div className="hidden sm:flex flex-wrap gap-x-3 gap-y-1 justify-end text-[10px] font-semibold text-muted-foreground">
              {Object.entries(zoneColors).map(([zone, color]) => (
                <div key={zone} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: color }} />
                  <span>{zone}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[350px] relative flex items-center justify-center">
            {calculatedData.length > 0 ? (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 25, right: 35, bottom: 25, left: 35 }}>
                    <XAxis type="number" dataKey="x" name="X" domain={[-10, 110]} hide />
                    <YAxis type="number" dataKey="y" name="Y" domain={[-10, 100]} hide />
                    <Tooltip content={<CustomChartTooltip />} />
                    
                    {/* Render standard zones as background */}
                    <Customized component={DuvalTriangleBackground} />
                    
                    {/* Render points */}
                    <Scatter name="Samples" data={scatterPoints} shape="circle">
                      {scatterPoints.map((entry, index) => {
                        const isSelected = selectedSampleNum === entry.sampleNum;
                        return (
                          <Cell 
                            key={`point-${index}`} 
                            fill={entry.color} 
                            stroke={isSelected ? "#fff" : "rgba(0,0,0,0.6)"}
                            strokeWidth={isSelected ? 2 : 1}
                            r={isSelected ? 10 : 6}
                            style={{ 
                              filter: isSelected ? "drop-shadow(0 0 8px rgba(255,255,255,0.8))" : "none",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() => setSelectedSampleNum(entry.sampleNum)}
                          />
                        );
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                <Layers size={40} className="text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-semibold text-foreground/80 mb-1">Visualizer Inactive</h3>
                <p className="text-xs max-w-sm leading-relaxed">
                  Upload a DGA CSV file to plot coordinates and classify fault diagnostics on the Duval Triangle.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Summary Dashboard Grid (Section 7) */}
      <AnimatePresence>
        {distributions && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="label-uppercase tracking-wider">Analysis Summary Dashboard</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Total Samples Card */}
              <MetricCard label="Total Samples Uploaded" value={distributions.total} unit="records" />

              {/* Rogers Distribution counts */}
              <div className="surface-card p-4 flex flex-col justify-between gap-3">
                <span className="label-uppercase block">Rogers Faults Distribution</span>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {distributions.rogers.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground truncate max-w-[120px]" title={item.name}>{item.name}</span>
                      <span className="font-mono text-foreground font-semibold">{item.val} <span className="text-[10px] text-muted-foreground font-normal">({item.pct.toFixed(0)}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* IEC Distribution counts */}
              <div className="surface-card p-4 flex flex-col justify-between gap-3">
                <span className="label-uppercase block">IEC Faults Distribution</span>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {distributions.iec.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground truncate max-w-[120px]" title={item.name}>{item.name}</span>
                      <span className="font-mono text-foreground font-semibold">{item.val} <span className="text-[10px] text-muted-foreground font-normal">({item.pct.toFixed(0)}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duval Distribution counts */}
              <div className="surface-card p-4 flex flex-col justify-between gap-3">
                <span className="label-uppercase block">Duval Zone Distribution</span>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {distributions.duval.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: zoneColors[item.name] }} />
                        <span className="text-muted-foreground font-bold">{item.name}</span>
                      </div>
                      <span className="font-mono text-foreground font-semibold">{item.val} <span className="text-[10px] text-muted-foreground font-normal">({item.pct.toFixed(0)}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 5: Structured Results Table */}
      {calculatedData.length > 0 && (
        <div className="surface-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">Structured Diagnostics Results</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Calculated ratios and fault classifications for every sample row</p>
              </div>
            </div>

            {/* Export & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleExportCSV}
                className="btn-secondary text-xs flex items-center gap-2 py-2"
              >
                <Download size={14} />
                Export CSV
              </button>
              <button 
                onClick={handleExportExcel}
                className="btn-secondary text-xs flex items-center gap-2 py-2"
              >
                <Download size={14} />
                Export Excel
              </button>
            </div>
          </div>

          {/* Table Filters Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search by fault label or zone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-sans"
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
              <span>Show rows:</span>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-background border border-border rounded-lg py-1 px-2 text-foreground focus:outline-none"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="ml-2 font-mono">Total filtered: {sortedAndFilteredData.length}</span>
            </div>
          </div>

          {/* Structured Table Container */}
          <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
            <table className="w-full border-collapse text-left text-xs text-foreground">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('sampleNum')}>
                    <div className="flex items-center gap-1">
                      Sample <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('r1')}>
                    <div className="flex items-center gap-1">
                      R1 (CH4/H2) <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('r2')}>
                    <div className="flex items-center gap-1">
                      R2 (C2H6/CH4) <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('r3')}>
                    <div className="flex items-center gap-1">
                      R3 (C2H4/C2H6) <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('r4')}>
                    <div className="flex items-center gap-1">
                      R4 (C2H2/C2H4) <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('rogersFault')}>
                    <div className="flex items-center gap-1">
                      Rogers Fault <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('i1')}>
                    <div className="flex items-center gap-1">
                      I1 (C2H2/C2H4) <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('i2')}>
                    <div className="flex items-center gap-1">
                      I2 (CH4/H2) <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('i3')}>
                    <div className="flex items-center gap-1">
                      I3 (C2H4/C2H6) <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('iecFault')}>
                    <div className="flex items-center gap-1">
                      IEC Fault <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('pctCh4')}>
                    <div className="flex items-center gap-1">
                      %CH4 <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('pctC2h4')}>
                    <div className="flex items-center gap-1">
                      %C2H4 <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('pctC2h2')}>
                    <div className="flex items-center gap-1">
                      %C2H2 <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('duvalZone')}>
                    <div className="flex items-center gap-1">
                      Duval Zone <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {paginatedData.map((row) => {
                  const isSelected = selectedSampleNum === row.sampleNum;
                  return (
                    <tr 
                      key={row.sampleNum} 
                      className={`hover:bg-secondary/40 cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""
                      }`}
                      onClick={() => setSelectedSampleNum(row.sampleNum)}
                    >
                      <td className="p-3 text-foreground font-bold">#{row.sampleNum}</td>
                      <td className="p-3">{row.h2 === 0 ? "N/A" : row.r1.toFixed(2)}</td>
                      <td className="p-3">{row.ch4 === 0 ? "N/A" : row.r2.toFixed(2)}</td>
                      <td className="p-3">{row.c2h6 === 0 ? "N/A" : row.r3.toFixed(2)}</td>
                      <td className="p-3">{row.c2h4 === 0 ? "N/A" : row.r4.toFixed(2)}</td>
                      <td className="p-3 text-foreground font-sans font-medium">{row.rogersFault}</td>
                      <td className="p-3">{row.c2h4 === 0 ? "N/A" : row.i1.toFixed(2)}</td>
                      <td className="p-3">{row.h2 === 0 ? "N/A" : row.i2.toFixed(2)}</td>
                      <td className="p-3">{row.c2h6 === 0 ? "N/A" : row.i3.toFixed(2)}</td>
                      <td className="p-3 text-foreground font-sans font-medium">{row.iecFault}</td>
                      <td className="p-3">{row.pctCh4.toFixed(1)}%</td>
                      <td className="p-3">{row.pctC2h4.toFixed(1)}%</td>
                      <td className="p-3">{row.pctC2h2.toFixed(1)}%</td>
                      <td className="p-3 font-bold" style={{ color: zoneColors[row.duvalZone] }}>
                        {row.duvalZone}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground font-sans">
              Showing page <b className="text-foreground font-mono">{currentPage}</b> of <b className="text-foreground font-mono">{totalPages || 1}</b> ({sortedAndFilteredData.length} records total)
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary p-1.5 text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="btn-secondary p-1.5 text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ask DGA Assistant chatbot panel */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isAssistantOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="surface-card w-80 sm:w-96 h-[480px] shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-4 border border-primary/20 bg-background/95 backdrop-blur-md text-foreground"
            >
              {/* Header */}
              <div className="bg-primary/10 border-b border-border px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="text-primary animate-pulse" size={20} />
                  <div>
                    <h3 className="font-bold text-xs text-foreground leading-none">Ask DGA Assistant</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Complex transformer science made simple.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAssistantOpen(false)}
                  className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors animate-none"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-muted">
                {chatHistory.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-normal shadow-sm whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none font-sans'
                          : 'bg-secondary/40 border border-border/30 text-foreground rounded-tl-none font-sans'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompts presets */}
              <div className="border-t border-border bg-muted/20 p-3 space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block mb-1 font-sans">Quick Prompts</span>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => handleChatPrompt("Explain in Simple Words")}
                    className="text-[10px] bg-background border border-border/80 hover:border-primary/50 text-foreground px-2 py-1 rounded-lg transition-colors font-medium flex items-center gap-1 font-sans"
                  >
                    <Sparkles size={10} className="text-primary animate-pulse" />
                    Explain in Simple Words
                  </button>
                  <button 
                    onClick={() => handleChatPrompt("Show side-by-side comparison")}
                    className="text-[10px] bg-background border border-border/80 hover:border-primary/50 text-foreground px-2 py-1 rounded-lg transition-colors font-medium font-sans"
                  >
                    Side-by-side comparison
                  </button>
                  <button 
                    onClick={() => handleChatPrompt(`Explain Selected Sample ${selectedSample ? '#' + selectedSample.sampleNum : ''}`)}
                    className="text-[10px] bg-background border border-border/80 hover:border-primary/50 text-foreground px-2 py-1 rounded-lg transition-colors font-medium font-sans"
                  >
                    Explain Active Sample
                  </button>
                  <button 
                    onClick={() => handleChatPrompt("Explain Duval Triangle")}
                    className="text-[10px] bg-background border border-border/80 hover:border-primary/50 text-foreground px-2 py-1 rounded-lg transition-colors font-medium font-sans"
                  >
                    What is Duval Triangle?
                  </button>
                  <button 
                    onClick={() => handleChatPrompt("Explain Rogers Ratios")}
                    className="text-[10px] bg-background border border-border/80 hover:border-primary/50 text-foreground px-2 py-1 rounded-lg transition-colors font-medium font-sans"
                  >
                    What are Rogers Ratios?
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Icon */}
        <button 
          onClick={() => setIsAssistantOpen(prev => !prev)}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group relative border border-primary-foreground/10"
          title="Open DGA Assistant"
        >
          <Bot size={24} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full border border-background flex items-center justify-center animate-bounce">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </span>
        </button>
      </div>

    </div>
  );
};

export default DgaFaultAnalysisPage;
