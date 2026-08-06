import type{Request,Response,NextFunction}from'express';import jwt from'jsonwebtoken';
export type Authed=Request&{user?:{id:number;vkUserId:string}};
export function auth(req:Authed,res:Response,next:NextFunction){const token=req.headers.authorization?.replace('Bearer ','');if(!token)return res.status(401).json({message:'Unauthorized'});try{req.user=jwt.verify(token,process.env.JWT_SECRET!) as {id:number;vkUserId:string};next()}catch{return res.status(401).json({message:'Invalid token'})}}
