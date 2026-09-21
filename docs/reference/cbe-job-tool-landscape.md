# Construction & Built Environment — 84 Job / Market Tool Matrix

**Status:** Active market-discovery baseline  
**Effective:** 21 September 2026  
**Authority:** `job-profiles.json` + `job-capabilities.json`  
**Scope:** all 84 governed Construction & Built Environment Job Profiles

## Purpose

This register tests the NuBlox product boundary at the level that matters: **can a person perform the job they are employed and deployed to do?**

The benchmark chain is:

```text
Job Profile
-> existing specialist capabilities
-> existing structured records
-> market tool category
-> current representative products
-> work pattern / professional output
-> participating Function candidates
-> native NuBlox requirement
```

The detailed machine-readable register is [cbe-job-market-tool-matrix.csv](cbe-job-market-tool-matrix.csv).

## Coverage

- 84 / 84 governed CBE Job Profiles mapped.
- Every row preserves the existing NuBlox specialist capabilities, structured records and lifecycle stages.
- Every Job Profile has an initial current-market tool set.
- Function mappings are deliberately marked **RESEARCH_CANDIDATE** until the governed Function/Job participation model is explicitly approved.
- Product lists are **discovery seeds, not claims of worldwide exhaustiveness**. The market is dynamic and each row now provides a controlled place to continue product/module verification.

## Delivery-domain coverage

| Delivery Domain | Jobs | Distinct initial market tools |
| --- | ---: | ---: |
| D01 | 4 | 20 |
| D02 | 8 | 39 |
| D03 | 6 | 24 |
| D04 | 3 | 14 |
| D05 | 5 | 21 |
| D06 | 4 | 14 |
| D07 | 16 | 25 |
| D08 | 9 | 28 |
| D09 | 5 | 24 |
| D10 | 2 | 11 |
| D11 | 8 | 27 |
| D12 | 3 | 11 |
| D13 | 5 | 21 |
| D14 | 4 | 20 |
| D15 | 1 | 6 |
| D16 | 1 | 6 |

## 84-job baseline

| # | Job Profile | Domain | Initial market tools |
| ---: | --- | --- | --- |
| 1 | **Acoustics consultant** | D02 | SoundPLANnoise; DataKustik CadnaA; ODEON Room Acoustics Software; Marshall Day Acoustics INSUL; Autodesk Revit; Bluebeam Revu |
| 2 | **Agricultural contractor** | D16 | Trimble Agriculture software; John Deere Operations Center; BigChange; Samsara; ServiceM8; SafetyCulture |
| 3 | **Architect** | D01 | Autodesk Revit; Graphisoft Archicad; Vectorworks Architect; ALLPLAN; AutoCAD; Rhino; Grasshopper; SketchUp; Autodesk Navisworks; Solibri; Bluebeam Revu; Autodesk Docs; Oracle Aconex; NBS Chorus |
| 4 | **Architectural technician** | D01 | Autodesk Revit; Graphisoft Archicad; Vectorworks Architect; ALLPLAN; AutoCAD; Autodesk Navisworks; Solibri; Bluebeam Revu; Autodesk Docs; NBS Chorus |
| 5 | **Architectural technologist** | D01 | Autodesk Revit; Graphisoft Archicad; Vectorworks Architect; ALLPLAN; AutoCAD; Autodesk Navisworks; Solibri; Bluebeam Revu; Autodesk Docs; Oracle Aconex; NBS Chorus |
| 6 | **Bricklayer** | D07 | Procore; Autodesk Build; Dalux Field; SafetyCulture; Tradify; Fergus; BigChange |
| 7 | **Builders' merchant** | D14 | Epicor BisTrack; Kerridge Commercial Systems K8; Sage 200; Microsoft Dynamics 365 Business Central; Oracle NetSuite; Phocas |
| 8 | **Building control officer** | D15 | Idox Cloud; Idox Uniform; Bluebeam Revu; ArcGIS Field Maps; PlanRadar; Microsoft Power BI |
| 9 | **Building services engineer** | D02 | Autodesk Revit; MagiCAD; IES VE 2026; DesignBuilder; Trimble ProDesign; DIALux evo; Autodesk Navisworks; Solibri; Autodesk Docs |
| 10 | **Building surveyor** | D03 | GoReport; PlanRadar; Bluebeam Revu; Matterport; Autodesk ReCap Pro; ArcGIS Field Maps; AutoCAD; Microsoft Power BI |
| 11 | **Building technician** | D02 | AutoCAD; Autodesk Revit; Bluebeam Revu; Autodesk Docs; Autodesk Navisworks; PlanRadar |
| 12 | **Caretaker** | D10 | Planon IWMS; IBM Maximo Application Suite; Eptura / Archibus; MRI Facilities Management; ServiceNow Field Service Management; SafetyCulture |
| 13 | **Carpenter** | D07 | Tradify; Fergus; ServiceM8; BigChange; SketchUp; AutoCAD; Procore; Autodesk Build |
| 14 | **Carpet fitter and floor layer** | D07 | MeasureSquare; RFMS MeasureMobile; Tradify; ServiceM8; Jobber; BigChange |
| 15 | **Cartographer** | D05 | Esri ArcGIS Pro; QGIS; Precisely MapInfo Pro; Safe Software FME; Adobe Illustrator |
| 16 | **Cavity insulation installer** | D09 | Joblogic; simPRO; BigChange; Tradify; SafetyCulture; PlanRadar |
| 17 | **Ceiling fixer** | D07 | Procore; Autodesk Build; Dalux Field; SafetyCulture; Tradify; Fergus; Bluebeam Revu |
| 18 | **Civil engineer** | D02 | Autodesk Civil 3D; Bentley OpenRoads Designer; 12d Model; Bentley MicroStation; Autodesk InfraWorks; Tekla Tedds; Autodesk Navisworks; Bentley ProjectWise; Bluebeam Revu |
| 19 | **Civil engineering technician** | D02 | Autodesk Civil 3D; Bentley OpenRoads Designer; AutoCAD; Bentley MicroStation; Trimble Business Center; Autodesk Navisworks; Bluebeam Revu |
| 20 | **Commercial energy assessor** | D09 | IES VE 2026; DesignBuilder; Elmhurst SBEM Online; iSBEM; Bentley EnergySimulator |
| 21 | **Conservator** | D13 | Arches; Axiell Collections; Esri ArcGIS Pro; QGIS; Bluebeam Revu; Autodesk ReCap Pro; Agisoft Metashape |
| 22 | **Construction contracts manager** | D04 | Thinkproject CEMAR; Oracle Primavera Unifier; Oracle Aconex; Asite; Procore; Icertis Contract Intelligence |
| 23 | **Construction labourer** | D06 | Procore; Autodesk Build; Dalux Field; SafetyCulture; BigChange; Samsara |
| 24 | **Construction manager** | D06 | Oracle Primavera P6; Asta Powerproject; Procore; Autodesk Build; Oracle Aconex; Asite; Dalux; Trimble Field View; Bluebeam Revu; SafetyCulture |
| 25 | **Construction plant mechanic** | D11 | HCSS Equipment360; Tenna; Samsara; IBM Maximo Application Suite; Fiix CMMS; SafetyCulture |
| 26 | **Construction plant operator** | D11 | Tenna; Samsara; HCSS Equipment360; Procore; Autodesk Build; SafetyCulture |
| 27 | **Construction site supervisor** | D06 | Procore; Autodesk Build; Dalux Field; Trimble Field View; PlanRadar; SafetyCulture; Bluebeam Revu |
| 28 | **Crane driver** | D11 | 3D Lift Plan; Liebherr Crane Planner 2.0; Procore; Autodesk Build; SafetyCulture; Tenna |
| 29 | **Demolition operative** | D06 | Procore; Autodesk Build; Dalux Field; PlanRadar; SafetyCulture; BigChange |
| 30 | **Domestic energy assessor** | D09 | Elmhurst RdSAP Go; Elmhurst RdSAP Online; Quidos iQ-Energy; Elmhurst Design SAP 10 |
| 31 | **Dryliner** | D07 | Procore; Autodesk Build; Dalux Field; SafetyCulture; Tradify; Fergus; Bluebeam Revu |
| 32 | **Electrician** | D08 | Trimble ProDesign; ElectricalOM; DIALux evo; simPRO; Joblogic; Commusoft; ServiceM8; Tradify |
| 33 | **Engineering construction technician** | D02 | AutoCAD; Autodesk Revit; Autodesk Navisworks; Bluebeam Revu; Autodesk Docs; Trimble Connect |
| 34 | **Estimator** | D04 | RIB CostX; RIB Candy; Causeway Estimating; ConQuest Estimating; Autodesk Takeoff; Bluebeam Revu; Trimble WinEst; Sage Estimating |
| 35 | **Facilities manager** | D10 | IBM Maximo Application Suite; Planon IWMS; MRI Software; Eptura / Archibus; Spacewell; IFS Cloud EAM; HxGN EAM; SAP Asset Management |
| 36 | **Fence installer** | D07 | Tradify; Fergus; ServiceM8; BigChange; Jobber; SafetyCulture |
| 37 | **Fire safety engineer** | D02 | Thunderhead Engineering PyroSim; NIST Fire Dynamics Simulator (FDS); Thunderhead Engineering Pathfinder; NIST CFAST; Oasys MassMotion; Autodesk Revit; Bluebeam Revu |
| 38 | **Formworker** | D07 | Tekla Structures; PERI CAD / planning tools; Doka Tipos / planning tools; Autodesk Revit; Procore; Autodesk Build; SafetyCulture |
| 39 | **Furniture maker** | D14 | Hexagon Cabinet Vision; Microvellum; Autodesk Fusion; SOLIDWORKS; Cyncly 3CAD; HOMAG productionManager |
| 40 | **Gas mains layer** | D12 | Esri ArcGIS Utility Network; Bentley OpenUtilities; Trimble Siteworks; IBM Maximo Application Suite; SAP Field Service Management; SafetyCulture |
| 41 | **Gas service technician** | D08 | Joblogic; simPRO; Commusoft; BigChange; ServiceM8; Tradify |
| 42 | **General practice surveyor** | D03 | ARGUS Enterprise; MRI Horizon; Yardi Voyager; Re-Leased; Esri ArcGIS Pro; Microsoft Power BI |
| 43 | **Geospatial technician** | D05 | Trimble Business Center; Leica Cyclone; Leica Infinity; Esri ArcGIS Pro; QGIS; Autodesk Civil 3D; Safe Software FME |
| 44 | **Glazier** | D07 | Cyncly Soft Tech; Orgadata Logikal; Tradify; simPRO; BigChange; ServiceM8 |
| 45 | **Heat pump engineer** | D08 | Heat Engineer Software; IES VE 2026; DesignBuilder; Joblogic; simPRO; Commusoft; Elmhurst Design SAP 10 |
| 46 | **Heating and ventilation engineer** | D08 | MagiCAD; Autodesk Revit; IES VE 2026; DesignBuilder; Danfoss Coolselector2; Joblogic; simPRO; Commusoft |
| 47 | **Heritage officer** | D13 | Arches; Idox Uniform; Esri ArcGIS Pro; QGIS; Axiell Collections; Microsoft Power BI |
| 48 | **Kitchen and bathroom designer** | D01 | Cyncly Winner Flex; Cyncly Innoplus; Virtual Worlds; ArtiCAD; 2020 Design Live; Cyncly EQ Flex |
| 49 | **Kitchen and bathroom fitter** | D07 | Tradify; Fergus; ServiceM8; BigChange; Procore; Autodesk Build |
| 50 | **Land surveyor** | D03 | Trimble Access; Trimble Business Center; Leica Captivate; Leica Infinity; Leica Cyclone; Topcon MAGNET; Autodesk Civil 3D |
| 51 | **Landscape architect** | D13 | Vectorworks Landmark; Land F/X; KeySCAPE; AutoCAD; SketchUp; Esri ArcGIS Pro; QGIS |
| 52 | **Landscaper** | D13 | Tradify; Fergus; Jobber; ServiceM8; BigChange; SketchUp; Vectorworks Landmark |
| 53 | **Lighting technician** | D11 | Vectorworks Spotlight; Capture; CAST WYSIWYG; Lightwright; grandMA3 onPC |
| 54 | **Locksmith** | D08 | Joblogic; simPRO; ServiceM8; BigChange; Tradify; Genetec Security Center; LenelS2 OnGuard |
| 55 | **Painter and decorator** | D07 | Tradify; Fergus; ServiceM8; Jobber; BigChange; Procore |
| 56 | **Pipe fitter** | D08 | AutoCAD Plant 3D; AVEVA E3D Design; Hexagon Smart 3D; Hexagon Isogen; Autodesk Navisworks; WeldEye |
| 57 | **Planning and development surveyor** | D03 | ARGUS Enterprise; LandTech; Esri ArcGIS Pro; ArcGIS Urban; Idox Uniform; Microsoft Power BI |
| 58 | **Plasterer** | D07 | Tradify; Fergus; ServiceM8; Jobber; BigChange; Procore |
| 59 | **Plumber** | D08 | simPRO; Joblogic; Commusoft; ServiceM8; Tradify; Fergus; BigChange |
| 60 | **Quantity surveyor** | D04 | RIB CostX; RIB Candy; Causeway Estimating; ConQuest Estimating; Bluebeam Revu; Autodesk Takeoff; Thinkproject CEMAR; Oracle Primavera Unifier; Procore |
| 61 | **Quarry engineer** | D11 | AggFlow DM; Command Alkon; Wenco; Hexagon MinePlan; IBM Maximo Application Suite; SafetyCulture |
| 62 | **Quarry worker** | D11 | Command Alkon; Wenco; Hexagon MinePlan; Tenna; Samsara; SafetyCulture |
| 63 | **Refrigeration and air-conditioning installer** | D08 | Danfoss Coolselector2; MagiCAD; Autodesk Revit; Joblogic; simPRO; Commusoft; ServiceM8 |
| 64 | **Road worker** | D12 | Bentley OpenRoads Designer; Autodesk Civil 3D; Trimble Siteworks; ArcGIS Field Maps; Procore; SafetyCulture |
| 65 | **Roofer** | D07 | Tradify; Fergus; Jobber; ServiceM8; BigChange; PlanRadar; SafetyCulture |
| 66 | **Rural surveyor** | D03 | Esri ArcGIS Pro; QGIS; MRI Horizon; Re-Leased; LandTech; Microsoft Power BI |
| 67 | **Scaffolder** | D11 | SMART Scaffolder; Avontus Scaffold Designer; Avontus Quantify; Procore; SafetyCulture; PlanRadar |
| 68 | **Security systems installer** | D08 | JVSG IP Video System Design Tool; System Surveyor; AutoCAD; Genetec Security Center; LenelS2 OnGuard; simPRO; Joblogic |
| 69 | **Shopfitter** | D07 | AutoCAD; Autodesk Revit; SketchUp; Procore; Autodesk Build; Bluebeam Revu; Tradify |
| 70 | **Solar panel installer** | D09 | OpenSolar; Valentin PV*SOL premium; SolarEdge Designer; PVcase; simPRO; Joblogic; ServiceM8 |
| 71 | **Steel erector** | D07 | Tekla Structures; Trimble Connect; Procore; Autodesk Build; Bluebeam Revu; SafetyCulture |
| 72 | **Steel fixer** | D07 | Tekla Structures; ALLPLAN; RebarCAD; AutoCAD; Trimble Connect; Procore; SafetyCulture |
| 73 | **Steeplejack** | D11 | SafetyCulture; PlanRadar; ArcGIS Field Maps; Matterport; Autodesk ReCap Pro; BigChange |
| 74 | **Stonemason** | D13 | AutoCAD; Rhino; SketchUp; Agisoft Metashape; Autodesk ReCap Pro; Tradify; Procore |
| 75 | **Structural engineer** | D02 | Tekla Structural Designer 2026; Tekla Tedds 2026; ETABS; SAP2000; STAAD.Pro; Autodesk Robot Structural Analysis; SCIA Engineer; Dlubal RFEM; Autodesk Revit; Tekla Structures |
| 76 | **Surveying technician** | D03 | Trimble Business Center; Trimble Access; Leica Infinity; Leica Cyclone; Topcon MAGNET; AutoCAD; ArcGIS Field Maps |
| 77 | **Thermal insulation engineer** | D09 | RIB CostX; Bluebeam Revu; Procore; Autodesk Build; SafetyCulture; Joblogic |
| 78 | **Tiler** | D07 | Tradify; Fergus; ServiceM8; Jobber; BigChange; MeasureSquare |
| 79 | **Town planner** | D05 | Idox Cloud; Idox Uniform; ArcGIS Urban; Esri ArcGIS Pro; LandTech; PlanX; Microsoft Power BI |
| 80 | **Town planning assistant** | D05 | Idox Cloud; Idox Uniform; Esri ArcGIS Pro; ArcGIS Online; LandTech; Microsoft Power BI |
| 81 | **Transport planner** | D05 | PTV Visum; Aimsun Next 26; Bentley CUBE; PTV Vissim; SATURN; Esri ArcGIS Pro |
| 82 | **Water network operative** | D12 | Esri ArcGIS Utility Network; Bentley OpenUtilities; Cityworks; IBM Maximo Application Suite; ArcGIS Field Maps; Trimble Siteworks; SafetyCulture |
| 83 | **Welder** | D14 | WeldEye; WeldTrace; Fronius WeldCube; Tekla PowerFab; EWM Xnet; SafetyCulture |
| 84 | **Wood machinist** | D14 | Hexagon Cabinet Vision; Microvellum; HOMAG woodWOP; ALPHACAM; Autodesk Fusion; Cyncly 3CAD |

## What this exposes about NuBlox

The 84 jobs do not reduce to one software pattern.

### 1. Specialist authoring and calculation

Some professions depend on domain engines that perform real technical computation or authoring, for example:

- BIM/CAD and technical design;
- structural analysis and code calculations;
- acoustic and fire modelling;
- building-services and energy simulation;
- surveying, point-cloud and geospatial processing;
- transport modelling;
- estimating and quantity take-off;
- fabrication / CNC / production definition.

For these jobs, storing the final PDF is not equivalent to performing the job.

### 2. Governed field execution

Trades and field roles require a different operating pattern:

```text
survey / enquiry
-> estimate / quote
-> job / work pack
-> labour / competency
-> material / plant allocation
-> safe system / permit
-> installation / repair
-> inspection / test
-> evidence / photos
-> certification / handover
-> valuation / invoice
-> service history
```

Products such as Joblogic, simPRO, BigChange, Tradify, ServiceM8, Procore, Autodesk Build, Dalux and SafetyCulture occupy parts of this space today.

### 3. Regulatory calculation and case systems

Several jobs rely on regulated or authority-specific workflows, including:

- building control;
- energy assessment / EPC calculation;
- planning case management;
- statutory inspection / evidence.

NuBlox must model both the operative calculation/case workflow and the evidence required to demonstrate that it was performed correctly.

### 4. Commercial and contractual control

Estimators, quantity surveyors and contracts managers need more than general finance:

- measurement and take-off;
- resource build-ups;
- cost plans / estimates / BoQs;
- tender comparisons;
- contract events and notices;
- valuations and payment;
- variations / compensation events;
- forecasts and final accounts.

### 5. Physical asset / maintenance continuity

Facilities, plant, utility and service roles require continuity from installed asset through inspection, defect, work order, parts, maintenance, test and service history.

## Current evidence anchors

The discovery baseline has been checked against current market evidence including:

- Tekla 2026 releases for structural design, calculations, structures and PowerFab;
- ALLPLAN 2026 design-to-build coverage;
- Trimble Business Center field-to-finish surveying;
- current UK field-service comparisons covering Joblogic, simPRO, BigChange, ServiceM8 and Tradify;
- Idox Cloud / Uniform regulatory case-management coverage for planning and building control;
- IES VE 2026;
- SoundPLAN current noise-modelling products;
- PTV Visum and Aimsun Next 26 transport modelling;
- SMART Scaffolder;
- Cyncly / Compusoft Winner Flex and Innoplus;
- Elmhurst RdSAP / Design SAP / SBEM software and Quidos iQ-Energy;
- current government energy-performance methodology and approved-software framework.

## Next decomposition

The next pass should turn each semicolon-delimited product set into one row per **Job Profile × Tool × Tool Capability**, adding:

- exact module / command / workflow;
- vendor;
- evidence URL;
- verified product version/date;
- input object/data;
- operation performed;
- output/work product;
- file/data formats;
- collaboration pattern;
- lifecycle/status model;
- review/approval/authority model;
- audit/evidence model;
- migration/import/export implications;
- native NuBlox requirement;
- NuBlox implementation coverage.

That is the level at which this benchmark becomes an executable product backlog rather than a market list.
