export function announcementMatchesPath(announcement:{targetMode:string;includedPaths:string[]|null;excludedPaths:string[]|null},pathname:string){
 const matches=(pattern:string)=>pattern.endsWith('/*')?pathname===pattern.slice(0,-2)||pathname.startsWith(pattern.slice(0,-1)):pathname===pattern;
 if(announcement.excludedPaths?.some(matches))return false;
 if(announcement.targetMode==='HOMEPAGE')return pathname==='/';
 if(announcement.targetMode==='SHOP')return pathname==='/shop'||pathname.startsWith('/shop/');
 if(announcement.targetMode==='CHECKOUT')return pathname==='/checkout'||pathname.startsWith('/checkout/');
 if(announcement.targetMode==='CUSTOM')return Boolean(announcement.includedPaths?.some(matches));
 return true;
}
