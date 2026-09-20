import {createClient, type Client} from '@libsql/client';
let client:Client|undefined;
class Statement {
 args:any[]=[];
 constructor(public sql:string,private client:Client){}
 bind(...args:any[]){this.args=args;return this;}
 async first(){const r=await this.client.execute({sql:this.sql,args:this.args});return r.rows[0]??null;}
 async all(){const r=await this.client.execute({sql:this.sql,args:this.args});return {results:r.rows};}
 async run(){return this.client.execute({sql:this.sql,args:this.args});}
}
export function database(){
 const url=process.env.TURSO_DATABASE_URL,authToken=process.env.TURSO_AUTH_TOKEN;
 if(!url||!authToken)throw Error('DB_CONNECTION_MISSING');
 client??=createClient({url,authToken});const db=client;
 return {prepare:(sql:string)=>new Statement(sql,db),batch:(statements:Statement[])=>db.batch(statements.map(s=>({sql:s.sql,args:s.args})),'write')};
}
