import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlUniversalFunctionReadRepository } from './universal-function-read-repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('Function Tool Registry and workspace composition',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('composes shared kernel tools across the canonical Function taxonomy',async()=>{
    if(!pool) throw new Error('Database pool missing.');
    const repository=new MySqlUniversalFunctionReadRepository(pool);
    const functions=await repository.listFunctions();
    const counts=await repository.getCounts();

    expect(counts).toMatchObject({coreBusiness:29,cbe:16});
    expect(functions).toHaveLength(45);
    expect(functions.every((fn)=>fn.toolComposition.some((item)=>
      item.toolId==='TOOL-K1-OBJECT-INSPECTOR'&&item.workspaceView==='OVERVIEW'
    ))).toBe(true);
    expect(functions.every((fn)=>fn.toolComposition.some((item)=>
      item.toolId==='TOOL-K1-WORK-QUEUE'&&item.workspaceView==='DELIVERY'
    ))).toBe(true);
  });

  it('registers F02 Corporate Governance as the first Function-specific reference composition',async()=>{
    if(!pool) throw new Error('Database pool missing.');
    const repository=new MySqlUniversalFunctionReadRepository(pool);
    const f02=await repository.getFunction('F02');

    expect(f02).not.toBeNull();
    expect(f02?.name).toBe('Corporate Governance');

    const boardPack=f02?.toolComposition.find((item)=>item.toolId==='TOOL-F02-BOARD-PACK-BUILDER');
    expect(boardPack).toMatchObject({
      workspaceView:'DELIVERY',
      workspaceZone:'WORK_SURFACE',
      operatingSide:'FUNCTIONAL_DELIVERY',
      tool:{
        code:'F02.BOARD_PACK_BUILDER',
        name:'Board Pack Builder',
        toolClass:'K3',
        ownerFunctionId:'F02',
        implementationState:'PLANNED'
      }
    });

    const resolution=f02?.toolComposition.find((item)=>item.toolId==='TOOL-F02-RESOLUTION-REGISTER'&&item.workspaceView==='GOVERNANCE');
    expect(resolution?.tool.requiredAuthorityScope).toBe('governance.board.resolve');
    expect(resolution?.tool.evidenceRequirements).toContain('quorum');
  });
});
