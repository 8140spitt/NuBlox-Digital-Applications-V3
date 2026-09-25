export interface EnterpriseThingVocabularyEntry {
  code:string;
  name:string;
  objectFamily:string;
  nativeObjectType:string;
  sourceAuthority:string;
  description:string;
}

export interface EnterpriseRelationshipVocabularyEntry {
  code:string;
  name:string;
  inverseName:string;
  fromTypeCode:string;
  toTypeCode:string;
  fromCardinality:'ONE'|'MANY';
  toCardinality:'ONE'|'MANY';
  nativeRelationshipTypes:readonly string[];
  sourceAuthority:string;
}

export const ENTERPRISE_THING_VOCABULARY = Object.freeze([
  {code:'PERSON',name:'Person',objectFamily:'PARTY',nativeObjectType:'PERSON',sourceAuthority:'PEOPLE_MASTER',description:'Authoritative human structural identity. Tenant workforce Persons carry the EMPLOYEE Party Type.'},
  {code:'ORGANISATION',name:'Organisation',objectFamily:'PARTY',nativeObjectType:'ORGANISATION',sourceAuthority:'PARTY_MASTER',description:'Authoritative legal/trading organisation identity. TENANT, CLIENT and VENDOR_SUPPLIER are Party Types on this identity, not duplicate masters.'},
  {code:'ORGANISATION_UNIT',name:'Organisation Unit',objectFamily:'ORGANISATION',nativeObjectType:'ORGANISATION_UNIT',sourceAuthority:'ORGANISATION_MASTER',description:'Structural unit within an Organisation.'},
  {code:'POSITION',name:'Position',objectFamily:'HCM',nativeObjectType:'POSITION',sourceAuthority:'HCM',description:'Enduring organisational position to which people, jobs, authority and Function participation are attached.'},
  {code:'PROJECT',name:'Project',objectFamily:'WORK_CONTEXT',nativeObjectType:'PROJECT',sourceAuthority:'PROJECT_PORTFOLIO',description:'Project delivery context shared by all participating Functions.'},
  {code:'PROGRAMME',name:'Programme',objectFamily:'WORK_CONTEXT',nativeObjectType:'PROGRAMME',sourceAuthority:'PROJECT_PORTFOLIO',description:'Programme context grouping coordinated projects and outcomes.'},
  {code:'CONTRACT',name:'Contract',objectFamily:'COMMERCIAL',nativeObjectType:'CONTRACT',sourceAuthority:'CONTRACT_COMMERCIAL',description:'Commercial or contractual agreement shared by delivery, procurement, finance and legal work.'},
  {code:'ASSET',name:'Asset',objectFamily:'ASSET',nativeObjectType:'ASSET',sourceAuthority:'ASSET_MASTER',description:'Physical or managed asset identity through acquisition, delivery, operation and retirement.'},
  {code:'LOCATION',name:'Location',objectFamily:'LOCATION',nativeObjectType:'LOCATION',sourceAuthority:'LOCATION_MASTER',description:'Shared physical, postal, geographic or operational location identity.'},
  {code:'SALES_ACCOUNT',name:'Sales Account',objectFamily:'COMMERCIAL',nativeObjectType:'SALES_ACCOUNT',sourceAuthority:'SALES',description:'Sales-owned customer relationship and commercial ownership record around an authoritative Organisation; it does not duplicate Organisation identity.'},
  {code:'OPPORTUNITY',name:'Opportunity',objectFamily:'COMMERCIAL',nativeObjectType:'OPPORTUNITY',sourceAuthority:'SALES',description:'Commercial opportunity pursued by Sales and consumed by downstream contract and delivery processes.'},
  {code:'PRODUCT',name:'Product',objectFamily:'PRODUCT_SERVICE',nativeObjectType:'PRODUCT',sourceAuthority:'PRODUCT_SERVICE_MASTER',description:'Product offered, procured, manufactured, supplied or installed.'},
  {code:'SERVICE',name:'Service',objectFamily:'PRODUCT_SERVICE',nativeObjectType:'SERVICE',sourceAuthority:'PRODUCT_SERVICE_MASTER',description:'Service offered, contracted, delivered or consumed.'},
  {code:'INFORMATION_CONTAINER',name:'Information Container',objectFamily:'INFORMATION',nativeObjectType:'INFORMATION_CONTAINER',sourceAuthority:'INFORMATION_CONTROL',description:'Controlled information identity for drawings, models, specifications and other governed information.'},
  {code:'DELIVERABLE_ITEM',name:'Deliverable Item',objectFamily:'DELIVERABLE',nativeObjectType:'DELIVERABLE_ITEM',sourceAuthority:'DELIVERABLE_CONTROL',description:'Required delivery output with responsibility, review, approval and issue state.'},
  {code:'CHANGE',name:'Change',objectFamily:'CHANGE',nativeObjectType:'CHANGE',sourceAuthority:'CHANGE_CONTROL',description:'Controlled change identity affecting one or more governed objects.'}
] as const satisfies readonly EnterpriseThingVocabularyEntry[]);

export const ENTERPRISE_RELATIONSHIP_VOCABULARY = Object.freeze([
  {
    code:'ORGANISATION_CONTAINS_UNIT',
    name:'Organisation contains Unit',
    inverseName:'Unit belongs to Organisation',
    fromTypeCode:'ORGANISATION',
    toTypeCode:'ORGANISATION_UNIT',
    fromCardinality:'ONE',
    toCardinality:'MANY',
    nativeRelationshipTypes:['ORGANISATION_CONTAINS_UNIT'],
    sourceAuthority:'ORGANISATION_MASTER'
  },
  {
    code:'UNIT_CONTAINS_UNIT',
    name:'Organisation Unit contains Unit',
    inverseName:'Unit belongs to parent Unit',
    fromTypeCode:'ORGANISATION_UNIT',
    toTypeCode:'ORGANISATION_UNIT',
    fromCardinality:'ONE',
    toCardinality:'MANY',
    nativeRelationshipTypes:['UNIT_CONTAINS_UNIT'],
    sourceAuthority:'ORGANISATION_MASTER'
  },
  {
    code:'UNIT_HAS_POSITION',
    name:'Organisation Unit has Position',
    inverseName:'Position belongs to Organisation Unit',
    fromTypeCode:'ORGANISATION_UNIT',
    toTypeCode:'POSITION',
    fromCardinality:'ONE',
    toCardinality:'MANY',
    nativeRelationshipTypes:['UNIT_HAS_POSITION','ORGANISATION_UNIT_HAS_POSITION'],
    sourceAuthority:'ORGANISATION_MASTER'
  },
  {
    code:'ORGANISATION_HAS_SALES_ACCOUNT',
    name:'Organisation has Sales Account',
    inverseName:'Sales Account represents Organisation relationship',
    fromTypeCode:'ORGANISATION',
    toTypeCode:'SALES_ACCOUNT',
    fromCardinality:'ONE',
    toCardinality:'MANY',
    nativeRelationshipTypes:['ORGANISATION_HAS_SALES_ACCOUNT'],
    sourceAuthority:'SALES'
  },
  {
    code:'SALES_ACCOUNT_HAS_OPPORTUNITY',
    name:'Sales Account has Opportunity',
    inverseName:'Opportunity belongs to Sales Account',
    fromTypeCode:'SALES_ACCOUNT',
    toTypeCode:'OPPORTUNITY',
    fromCardinality:'ONE',
    toCardinality:'MANY',
    nativeRelationshipTypes:['SALES_ACCOUNT_HAS_OPPORTUNITY'],
    sourceAuthority:'SALES'
  },
  {
    code:'PERSON_OCCUPIES_POSITION',
    name:'Person occupies Position',
    inverseName:'Position occupied by Person',
    fromTypeCode:'PERSON',
    toTypeCode:'POSITION',
    fromCardinality:'MANY',
    toCardinality:'MANY',
    nativeRelationshipTypes:['PERSON_OCCUPIES_POSITION'],
    sourceAuthority:'HCM'
  }
] as const satisfies readonly EnterpriseRelationshipVocabularyEntry[]);

export const ENTERPRISE_THING_TYPE_CODES = Object.freeze(
  ENTERPRISE_THING_VOCABULARY.map(item=>item.code)
);
