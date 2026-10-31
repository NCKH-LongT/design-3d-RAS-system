export function headLoss(qM3h,diameterMm,length,k=0,roughnessMm=.0015){
 if(qM3h<=0)return 0;const D=diameterMm/1000,q=qM3h/3600,v=q/(Math.PI*D*D/4),re=v*D/1e-6;
 const f=re<2300?64/re:.25/Math.log10(roughnessMm/1000/(3.7*D)+5.74/Math.pow(re,.9))**2;
 return(f*length/D+k)*v*v/(2*9.80665);
}
