if (!Math.log10) {
  Math.log10 = Math.log10 || function (x) {
    return Math.log(x) * Math.LOG10E;
  };
}

function findTC(thetae, xp)
{
    //this function returns tempC for a given P and theta-e
    //it's used to find lfc, el, and cape
    var crit = 0.1;//criteria
    var eq0 = thetae;
    var eq1 = 0;
    var tlev = 10 - ((1000-xp)/10);
    //calc thetae for tlev and p
    for(var k=0; k<100; k++){
        eq1 = calcThetaE(xp, tlev, tlev);
        var diff = Math.abs(eq0-eq1);
        if(diff < 0.1){//close enough
            break;
        }else if(eq1>eq0){//our try (eq1) is larger than the obs theta-e (eq0)
            tlev = tlev - (diff/10);//so we subtract half the difference from tlev and try again
        }else{//otherwise, we add the difference 
            tlev = tlev + (diff/10);    
        }
    }
    return tlev;
}

function calcThetaE(pres,t,dp)
{
    var vp=calcVaporPressure(dp);//ambient vapor pressure
    var w=calcMixingRatio(vp, pres);
    var tlclk = calcLclTemp(pres,t,dp);
    var PT = (t + 273.15) * Math.pow(1000/pres, 0.2854*(1-(0.00028*w)));
    var EPTK = PT * Math.exp(((3.376/tlclk)-0.00254)*w*(1+(0.00081*w)));
    return Math.round(EPTK*10)/10;
}

function calcVaporPressure( temp )
{
    var vp = 6.11 * Math.exp(5423 * (1/273 - 1/(temp+273)));
    return vp;
}

function calcMixingRatio (vapor, press)
{
    return (((0.62197*vapor)/(press-vapor))*1000.0);
}

function log10(x) {
    return (Math.log(x) / Math.log(10));    
}

function calcLclTemp(pres, t, td)
{
  t  += 273.15;
  td += 273.15;
  var RCP = 0.286;

  var ESTD = -2937.4/td-4.9283*Math.log10(td) + 23.5471;
  ESTD = Math.pow(10.0, ESTD);
  var WS = 0.622*ESTD/pres;
  var PUP = pres;
 
  var cond = true;
  var TNEW, ESNEW, WSNEW;
  var TLCL, PLCL;
  while (cond) {
    PUP = PUP-1.;
    var TNEW = t*Math.pow((PUP/pres), RCP);
    ESNEW = -2937.4/TNEW-4.9283*Math.log10(TNEW) + 23.5471;
    ESNEW = Math.pow(10., ESNEW);
    WSNEW = 0.622*ESNEW/PUP;
    if (WS >= WSNEW) {
      PLCL = PUP;
      TLCL = TNEW;
      break;
    }
  }

  return TLCL; //KELVIN
}