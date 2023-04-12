<?
Header("Content-Type: text/plain");

// 1. 사용자 입력사항
$mode = $_REQUEST["mode"];

if(empty($mode) && $mode != "0") {
  printf("###error");
  return;
}

$tmfc  = $_REQUEST["tmfc"];
$var   = $_REQUEST["var"];
$level = $_REQUEST["level"];
$model = $_REQUEST["model"];
$stn   = $_REQUEST["stn"];

$tm1   = $_REQUEST["tm1"];
$tm2   = $_REQUEST["tm2"];

// 시간 정보 조회(최신 수치모델 발표 시각)
if ($mode == "0") {
  $itv = 12;
  $nt  = time();
  $nt  = intval($nt / ($itv * 60 * 60)) * $itv * 60 * 60;
  $tm  = date("YmdHi",$nt); 

  for ($k = 0; $k < 4; $k++) {
    if (file_check(date("YmdHi",$nt), "T", 500, "GDPS")) {
      break;
    }
    else $nt -= 12*60*60;
  }

  echo date("YmdHi",$nt);
}
// 지점 정보 조회
else if ($mode == "1") {
  $fname = "/fct/REF/INI/reg_sort.ini";
  $fp = fopen($fname,"r");
  if ($fp) {
    while (!feof($fp)) {
      $str = fgets($fp, 2048);
      if ($str[0] == "#") continue;
      echo $str;
    }
    fclose($fp);

    $arr = explode(",",$str);
    $sort = $arr[0];
  }

  echo "\n";
  $fname = "/fct/REF/INI/upp_sort.ini";
  $fp = fopen($fname,"r");
  if ($fp) {
    while (!feof($fp)) {
      $str = fgets($fp, 2048);
      if ($str[0] == "#") continue;
      $arr = explode(",",$str);
      echo intval($arr[0]+$sort+1).",";
      echo "UPP,";
      echo $arr[1].",";
      echo $arr[2];
    }
    fclose($fp);
  }
}
// 수치모델 자료 조회
else if ($mode == "2") {
  if ($var == "T" && $level == "SFC") {
    $var = "TA";
  }


  if ($var == "TD" && $level != "SFC") {
    $var  = "T";
    $var1 = "RH";
    if (file_check($tmfc, $var, $level, $model) == 1 && file_check($tmfc, $var1, $level, $model) == 1) {
      file_check($tmfc, $var, $level, $model);
      $fp = fopen($fname,"r");
      if ($fp) {
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr = explode(",",$str);
          if ((intval($arr[0]) == intval($stn)) || (intval($arr[0]) == intval($stn)+47000)) {       
            break;
          }
        }
        fclose($fp);
      }

      file_check($tmfc, $var1, $level, $model);
      $fp = fopen($fname,"r");
      if ($fp) {
        $line = 0;
        $ok = 0;
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr1 = explode(",",$str);
          if ($line == 1) {
            $tm_arr = array();
            $nt = mktime(substr($tmfc,8,2),0,0,substr($tmfc,4,2),substr($tmfc,6,2),substr($tmfc,0,4));
            for($i=2; $i<count($arr1); $i++) {
              $itv = intval($arr1[$i]);
              $tm_arr[$i] = date("YmdHi", $nt + $itv*60*60);
            }
          }

          if ((intval($arr1[0]) == intval($stn)) || (intval($arr1[0]) == intval($stn)+47000)) {       
            for($i=2; $i<count($arr); $i++) {
              $td = fnGetDewTemperature(floatval($arr[$i]+273.15), floatval($arr1[$i]), floatval($level));
              echo $tm_arr[$i].",".sprintf("%.1f",$td)."\n";
            }
            $ok = 1;
            break;
          }
          $line++;
        }
        if ($ok == 0) echo "@no data\n";
        fclose($fp);
      }
    }
    else {
      echo "@no data\n";
    }
  }
  else if ($var == "TW" && $level == "SFC") {
    $var  = "TA";
    $var1 = "TD";
    if (file_check($tmfc, $var, $level, $model) == 1 && file_check($tmfc, $var1, $level, $model) == 1) {
      file_check($tmfc, $var, $level, $model);
      $fp = fopen($fname,"r");
      if ($fp) {
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr = explode(",",$str);
          if ((intval($arr[0]) == intval($stn)) || (intval($arr[0]) == intval($stn)+47000)) {       
            break;
          }
        }
        fclose($fp);
      }

      file_check($tmfc, $var1, $level, $model);
      $fp = fopen($fname,"r");
      if ($fp) {
        $line = 0;
        $ok = 0;
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr1 = explode(",",$str);
          if ($line == 1) {
            $tm_arr = array();
            $nt = mktime(substr($tmfc,8,2),0,0,substr($tmfc,4,2),substr($tmfc,6,2),substr($tmfc,0,4));
            for($i=2; $i<count($arr1); $i++) {
              $itv = intval($arr1[$i]);
              $tm_arr[$i] = date("YmdHi", $nt + $itv*60*60);
            }
          }

          if ((intval($arr1[0]) == intval($stn)) || (intval($arr1[0]) == intval($stn)+47000)) {       
            for($i=2; $i<count($arr); $i++) {
              $ta = floatval($arr[$i]);
              $td = floatval($arr1[$i]);
              $rh = fnGetRelativeHumidity($ta, $td);
              $tw = fnGetWetBulbTemperature($ta, $rh);
              echo $tm_arr[$i].",".sprintf("%.1f",$tw)."\n";
            }
            $ok = 1;
            break;
          }
          $line++;
        }
        if ($ok == 0) echo "@no data\n";
        fclose($fp);
      }
    }
    else {
      echo "@no data\n";
    }
  }
  else if ($var == "EPOT") {
    $var  = "T";
    $var1 = "RH";
    if (file_check($tmfc, $var, $level, $model) == 1 && file_check($tmfc, $var1, $level, $model) == 1) {
      file_check($tmfc, $var, $level, $model);
      $fp = fopen($fname,"r");
      if ($fp) {
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr = explode(",",$str);
          if ((intval($arr[0]) == intval($stn)) || (intval($arr[0]) == intval($stn)+47000)) {       
            break;
          }
        }
        fclose($fp);
      }

      file_check($tmfc, $var1, $level, $model);
      $fp = fopen($fname,"r");
      if ($fp) {
        $line = 0;
        $ok = 0;
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr1 = explode(",",$str);
          if ($line == 1) {
            $tm_arr = array();
            $nt = mktime(substr($tmfc,8,2),0,0,substr($tmfc,4,2),substr($tmfc,6,2),substr($tmfc,0,4));
            for($i=2; $i<count($arr1); $i++) {
              $itv = intval($arr1[$i]);
              $tm_arr[$i] = date("YmdHi", $nt + $itv*60*60);
            }
          }

          if ((intval($arr1[0]) == intval($stn)) || (intval($arr1[0]) == intval($stn)+47000)) {       
            for($i=2; $i<count($arr); $i++) {
              $ta = floatval($arr[$i]);
              $td = fnGetDewTemperature(($ta+273.15), floatval($arr1[$i]), floatval($level));
              $tlcl = fnGetLclTemp(floatval($level), $ta, $td);
              $mr = fnGetMixingratio($ta, $td, floatval($level));
              $ept = fnGetEpt(floatval($level)*100, $ta+273.15, $mr*0.001, $tlcl+273.15);
              echo $tm_arr[$i].",".sprintf("%.1f",$ept)."\n";
            }
            $ok = 1;
            break;
          }
          $line++;
        }
        if ($ok == 0) echo "@no data\n";
        fclose($fp);
      }
    }
    else {
      echo "@no data\n";
    }
  }
  else if ($var == "RNAC") {
    if (file_check($tmfc, $var, $level, $model) == 1) {
      $fp = fopen($fname,"r");
      if ($fp) {
        $line = 0;
        $ok = 0;
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr = explode(",",$str);
          if ($line == 1) {
            $tm_arr = array();
            $nt_arr = array();
            for($i=2; $i<count($arr); $i++) {
              $itv = intval($arr[$i]);
              $nt_arr[$i] = mktime(substr($tmfc,8,2),0,0,substr($tmfc,4,2),substr($tmfc,6,2),substr($tmfc,0,4)) + $itv*60*60;
              $tm_arr[$i] = date("YmdHi", $nt_arr[$i]);
            }
          }

          if ((intval($arr[0]) == intval($stn)) || (intval($arr[0]) == intval($stn)+47000)) {
            for($i=2; $i<count($arr); $i++) {
              if ($i > 2 && ($nt_arr[$i] - $nt_arr[$i-1]) > 60*60) {
                $itv = ($nt_arr[$i] - $nt_arr[$i-1]) / (60*60);
                for ($j=1; $j<=$itv; $j++) {
                  echo date("YmdHi", $nt_arr[$i-1] + $j*60*60).",".floatval($arr[$i]/$itv)."\n";
                }
              }
              else echo $tm_arr[$i].",".floatval($arr[$i])."\n";
            }
            $ok = 1;
            break;
          }
          $line++;
        }
        if ($ok == 0) echo "@no data\n";
        fclose($fp);
      }
    }
    else {
      echo "@no data\n";
    }
  }
  else if ($var == "WND") {
    $var  = "WSD";
    $var1 = "VEC";
    if (file_check($tmfc, $var, $level, $model) == 1 && file_check($tmfc, $var1, $level, $model) == 1) {
      file_check($tmfc, $var, $level, $model);
      $fp = fopen($fname,"r");
      if ($fp) {
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr = explode(",",$str);
          if ((intval($arr[0]) == intval($stn)) || (intval($arr[0]) == intval($stn)+47000)) {       
            break;
          }
        }
        fclose($fp);
      }

      file_check($tmfc, $var1, $level, $model);
      $fp = fopen($fname,"r");
      if ($fp) {
        $line = 0;
        $ok = 0;
        while (!feof($fp)) {
          $str = fgets($fp, 2048);
          $arr1 = explode(",",$str);
          if ($line == 1) {
            $tm_arr = array();
            $nt = mktime(substr($tmfc,8,2),0,0,substr($tmfc,4,2),substr($tmfc,6,2),substr($tmfc,0,4));
            for($i=2; $i<count($arr1); $i++) {
              $itv = intval($arr1[$i]);
              $tm_arr[$i] = date("YmdHi", $nt + $itv*60*60);
            }
          }

          if ((intval($arr1[0]) == intval($stn)) || (intval($arr1[0]) == intval($stn)+47000)) {       
            for($i=2; $i<count($arr); $i++) {
              echo $tm_arr[$i].",".floatval($arr[$i]).":".floatval($arr1[$i])."\n";
            }
            $ok = 1;
            break;
          }
          $line++;
        }
        if ($ok == 0) echo "@no data\n";
        fclose($fp);
      }
    }
    else {
      echo "@no data\n";
    }
  }
  else {
    if (file_check($tmfc, $var, $level, $model) == 1) {
      $fp = fopen($fname,"r");
      if ($fp) {
        $line = 0;
        $ok = 0;
        while (!feof($fp)) {
          $str = fgets($fp, 4096);
          $arr = explode(",",$str);
          if ($line == 1) {
            $tm_arr = array();
            $nt = mktime(substr($tmfc,8,2),0,0,substr($tmfc,4,2),substr($tmfc,6,2),substr($tmfc,0,4));
            for($i=2; $i<count($arr); $i++) {
              $itv = intval($arr[$i]);
              $tm_arr[$i] = date("YmdHi", $nt + $itv*60*60);
            }
          }

          if ((intval($arr[0]) == intval($stn)) || (intval($arr[0]) == intval($stn)+47000)) {
            for($i=2; $i<count($arr); $i++) {
              echo $tm_arr[$i].",".floatval($arr[$i])."\n";
            }
            $ok = 1;
            break;
          }
          $line++;
        }
        if ($ok == 0) echo "@no data\n";
        fclose($fp);
      }
    }
    else {
      echo "@no data\n";
    }
  }

  return;
}
// 관측 자료 조회
else if ($mode == "3") {
  // DB 연결
  $mode_login = 2;  // AFS
  $login_php = "/fct/www/include/tb_login.php";
  require( $login_php );
  $dbconn = TB_Login($mode_login);

  $itv = 1;
  $nt = time();
  $nt = intval($nt / ($itv * 60 * 60)) * $itv * 60 * 60;

  $nt1 = mktime(substr($tm1,8,2),0,0,substr($tm1,4,2),substr($tm1,6,2),substr($tm1,0,4));
  $nt2 = mktime(substr($tm2,8,2),0,0,substr($tm2,4,2),substr($tm2,6,2),substr($tm2,0,4));

  if ($nt1 > $nt) $nt1 = $nt;
  if ($nt2 > $nt) $nt2 = $nt;

  $count = 0;

  if ($level == "SFC") {
    $tm1 = date("YmdHi", $nt1);
    $tm2 = date("YmdHi", $nt2);

    if ($var == "T") {

      // SQL
      $sz = "
      select to_char(tm,'yyyymmddhh24mi') tm, ta
      from aws_hr_ta
      where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
        and aws_id = :aws_id
      order by tm
      ";

      $stmt = odbc_prepare($dbconn, $sz);
      $exec = odbc_execute($stmt, array($tm1, $tm2, $stn));
      while ($rs = odbc_fetch_array($stmt)) {
        echo $rs[TM].",";
        echo $rs[TA]."\n";
        $count++;
      }
      if ($count == 0) echo "@no data\n";
    }
    else if ($var == "RNAC") {

      // SQL
      $sz = "
      select to_char(tm,'yyyymmddhh24mi') tm, rn_hr1
      from aws_hr_rn
      where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
        and aws_id = :aws_id
      order by tm
      ";

      $stmt = odbc_prepare($dbconn, $sz);
      $exec = odbc_execute($stmt, array($tm1, $tm2, $stn));
      while ($rs = odbc_fetch_array($stmt)) {
        echo $rs[TM].",";
        echo $rs[RN_HR1]."\n";
        $count++;
      }
      if ($count == 0) echo "@no data\n";
    }
    else if ($var == "TD") {

      // SQL
      $sz = "
      select A.tm, A.ta, B.hm, C.ps
      from (
        select to_char(tm,'yyyymmddhh24mi') tm, ta
        from aws_hr_ta
        where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
          and aws_id = :aws_id
      ) A, (
        select to_char(tm,'yyyymmddhh24mi') tm, hm
        from aws_hr_hm
        where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
          and aws_id = :aws_id
      ) B, (
        select to_char(tm,'yyyymmddhh24mi') tm, ps
        from aws_hr_ps
        where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
          and aws_id = :aws_id
      ) C
      where A.tm = B.tm
        and A.tm = C.tm
      order by tm
      ";

      $stmt = odbc_prepare($dbconn, $sz);
      $exec = odbc_execute($stmt, array($tm1, $tm2, $stn, $tm1, $tm2, $stn, $tm1, $tm2, $stn));
      while ($rs = odbc_fetch_array($stmt)) {
        echo $rs[TM].",";
        echo sprintf("%.1f", fnGetDewTemperatureSFC(floatval($rs[TA]), floatval($rs[HM])))."\n";
        $count++;
      }
      if ($count == 0) echo "@no data\n";
    }
    else if ($var == "TW") {

      // SQL
      $sz = "
      select A.tm, A.ta, B.hm
      from (
        select to_char(tm,'yyyymmddhh24mi') tm, ta
        from aws_hr_ta
        where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
          and aws_id = :aws_id
      ) A, (
        select to_char(tm,'yyyymmddhh24mi') tm, hm
        from aws_hr_hm
        where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
          and aws_id = :aws_id
      ) B
      where A.tm = B.tm
      order by tm
      ";

      $stmt = odbc_prepare($dbconn, $sz);
      $exec = odbc_execute($stmt, array($tm1, $tm2, $stn, $tm1, $tm2, $stn));
      while ($rs = odbc_fetch_array($stmt)) {
        echo $rs[TM].",";
        echo sprintf("%.1f", fnGetWetBulbTemperature(floatval($rs[TA]), floatval($rs[HM])))."\n";
        $count++;
      }
      if ($count == 0) echo "@no data\n";
    }
    else if ($var == "PSL") {

      // SQL
      $sz = "
      select to_char(tm,'yyyymmddhh24mi') tm, ps
      from aws_hr_ps
      where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
        and aws_id = :aws_id
      order by tm
      ";

      $stmt = odbc_prepare($dbconn, $sz);
      $exec = odbc_execute($stmt, array($tm1, $tm2, $stn));
      while ($rs = odbc_fetch_array($stmt)) {
        echo $rs[TM].",";
        echo $rs[PS]."\n";
        $count++;
      }
      if ($count == 0) echo "@no data\n";
    }
    else if ($var == "WND") {

      // SQL
      $sz = "
      select to_char(tm,'yyyymmddhh24mi') tm, wd, ws
      from aws_hr_wd
      where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
        and aws_id = :aws_id
      order by tm
      ";

      $stmt = odbc_prepare($dbconn, $sz);
      $exec = odbc_execute($stmt, array($tm1, $tm2, $stn));
      while ($rs = odbc_fetch_array($stmt)) {
        echo $rs[TM].",";
        echo $rs[WS].":";
        echo $rs[WD]."\n";
        $count++;
      }
      if ($count == 0) echo "@no data\n";
    }
    else echo "@no data\n";
  }
  else {
    $tm1 = date("YmdHi", $nt1-9*60*60);
    $tm2 = date("YmdHi", $nt2-9*60*60);

    // SQL
    $sz = "
    select to_char(tm,'yyyymmddhh24mi') tm, nvl(ta*0.1,-999) ta, nvl(td*0.1,-999) td, wd, nvl(wd,-999) wd, nvl(ws*1852.0/3600.0,-999) ws, nvl(gh,-999) gh
    from upp_temp
    where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
      and stn_id = :stn_id
      and pa = :pa
    order by tm
    ";

    $stmt = odbc_prepare($dbconn, $sz);
    $exec = odbc_execute($stmt, array($tm1, $tm2, $stn, $level*10));
    while ($rs = odbc_fetch_array($stmt)) {
      $tm = $rs[TM];
      $nt = mktime(substr($tm,8,2),0,0,substr($tm,4,2),substr($tm,6,2),substr($tm,0,4));
      $tm = date("YmdHi", $nt+9*60*60);
      if ($var == "T") {
        if ($rs[TA] == -999) continue;
        echo $tm.",";
        echo $rs[TA]."\n";
        $count++;
      }
      else if ($var == "TD") {
        if ($rs[TD] == -999) continue;
        echo $tm.",";
        echo $rs[TD]."\n";
        $count++;
      }
      else if ($var == "GH") {
        if ($rs[GH] == -999) continue;
        echo $tm.",";
        echo $rs[GH]."\n";
        $count++;
      }
      else if ($var == "WND") {
        if ($rs[WS] == -999 || $rs[WD] == -999) continue;
        echo $tm.",";
        echo sprintf("%.1f", floatval($rs[WS])).":".$rs[WD]."\n";
        $count++;
      }
      else if ($var == "EPOT") {
        if ($rs[TA] == -999 || $rs[TD] == -999) continue;
        $ta = $rs[TA];
        $td = $rs[TD];
        $tlcl = fnGetLclTemp(floatval($level), $ta, $td);
        $mr = fnGetMixingratio($ta, $td, floatval($level));
        $ept = fnGetEpt(floatval($level)*100, $ta+273.15, $mr*0.001, $tlcl+273.15);

        echo $tm.",";
        echo sprintf("%.1f", $ept)."\n";
        $count++;
      }
    }

    if ($count == 0) echo "@no data\n";
  }

  odbc_close($dbconn);  
  return;
}
// 관측 단열선도 조회
else if ($mode == "4") {
  // DB 연결
  $mode_login = 2;  // AFS
  $login_php = "/fct/www/include/tb_login.php";
  require( $login_php );
  $dbconn = TB_Login($mode_login);

  $itv = 1;
  $nt = time();
  $nt = intval($nt / ($itv * 60 * 60)) * $itv * 60 * 60;

  $nt1 = mktime(substr($tm1,8,2),0,0,substr($tm1,4,2),substr($tm1,6,2),substr($tm1,0,4));
  $nt2 = mktime(substr($tm2,8,2),0,0,substr($tm2,4,2),substr($tm2,6,2),substr($tm2,0,4));

  if ($nt1 > $nt) $nt1 = $nt;
  if ($nt2 > $nt) $nt2 = $nt;

  $count = 0;

  $tm1 = date("YmdHi", $nt1-9*60*60);
  $tm2 = date("YmdHi", $nt2-9*60*60);

  // SQL
  $sz = "
  select to_char(tm,'yyyymmddhh24mi') tm, pa*0.1 pa, nvl(ta*0.1,-999) ta, nvl(td*0.1,-999) td, wd, nvl(wd,-999) wd, nvl(ws*1852.0/3600.0,-999) ws, nvl(gh,-999) gh
  from upp_temp
  where tm >= to_date(:tm,'yyyymmddhh24mi') and tm <= to_date(:tm,'yyyymmddhh24mi')
    and stn_id = :stn_id
  order by tm, pa desc
  ";

  $stmt = odbc_prepare($dbconn, $sz);
  $exec = odbc_execute($stmt, array($tm1, $tm2, $stn));
  $nt0 = 0;
  while ($rs = odbc_fetch_array($stmt)) {
    if ($count == 0) echo "[";
    $tm = $rs[TM];
    $nt = mktime(substr($tm,8,2),0,0,substr($tm,4,2),substr($tm,6,2),substr($tm,0,4));
    if ($nt != $nt0) {
      if ($count != 0) {
        echo "\n";
        echo "  ]\n";
        echo "},\n";
      }
      $tm = date("YmdH", $nt+9*60*60);
      echo "{\n";
      echo "  \"tm_ef\": \"".$tm."\",\n";
      $nt0 = $nt;
      $line = 0;
    }
    if ($line == 0) echo "  \"data\": [\n";
    else echo ",\n";
    printf("    {\"pres\": \"%.0f\", \"ta\": \"%.1f\", \"td\": \"%.1f\", \"vec\": \"%.1f\", \"wsd\": \"%.1f\", \"gh\": \"%.1f\"}",
         $rs['PA'], $rs['TA'], $rs['TD'], $rs['WD'], $rs['WS'], $rs['GH']);

    $line++;
    $count++;
  }

  if ($count == 0) echo "@no data\n";
  else {
    echo "\n";
    echo "  ]\n";
    echo "}]\n";
  }

  odbc_close($dbconn);  
  return;
}



// 예보 자료 존재여부 체크
function file_check($tm, $var, $level, $model)
{
  global $fname;

  $nt = mktime(substr($tm,8,2),0,0,substr($tm,4,2),substr($tm,6,2),substr($tm,0,4)) - 9*60*60;
  $tm = date("YmdHi", $nt);

  $YY          = substr($tm, 0, 4);
  $MM          = substr($tm, 4, 2);
  $DD          = substr($tm, 6, 2);
  $HH          = substr($tm, 8, 2);
  $MI          = substr($tm, 10, 2);

  $fname = "/C4N2_DATA/NWP/NWPHR/".$YY.$MM."/".$DD."/".$model."_STN_".$var."_".$level.".".$YY.$MM.$DD.$HH.".csv";

  if (file_exists($fname)) {
    return 1;
  }
  else {
    return 0;
  }
}

// 이슬점온도 산출(지상)
function fnGetDewTemperatureSFC($ta, $rh)
{
  $result = NULL;

  $es = 6.112*exp((17.67*$ta)/($ta+243.5));
  $e = $es*$rh*0.01;
  $result = log($e/6.112)*243.5/(17.67-log($e/6.112));

  if (is_nan($result)) $result = NULL;

  return $result;
}

// 이슬점온도 산출
function fnGetDewTemperature($ta, $rh, $pres)
{
  $result = NULL;

  // 상수 정의
  $eps = 0.622;
  $eZero = 6.112;
  $eslCon1 = 17.67;
  $eslCon2 = 29.65;
  $d2k = 273.15;

  if ($rh <= 0.0) {
    $rh = 0.1;
  } else if ($rh > 100.0) {
    $rh = 100.0;
  }

  // 계산
  $pEvaps = $eZero * exp($eslCon1 * ($ta - $d2k) / ($ta - $eslCon2));
  $shs = ($eps * $pEvaps) / ($pres - $pEvaps);
  $specificHumidity = $rh * $shs / 100.0;

  $pe = $specificHumidity * $pres / ($eps + $specificHumidity);
  $peLog = log($pe / $eZero);
  $result = (243.5 * $peLog) / ($eslCon1 - $peLog);

  if (is_nan($result)) $result = NULL;

  return $result;
}

// 혼합비 산출
function fnGetMixingratio($ta, $td, $pres)
{
  $result = NULL;
  $ckvn = 273.15;
  $evap = 0;
  $rmix = 0;

  if ($ta && $td && $pres)
  {
    //CKVN /273.15/
    //TMP : 기온(섭씨), Tdew(K) : 이슬점온도, PRES : 기압
    //Evap  = 6.11*exp((17.269*(Tdew+CKVN)-4717.3) / ((Tdew+CKVN)-35.86))
    //rmix  = (0.622*Evap)/(PRES-Evap) !Mixing Ratio (kg/kg)

    $evap = 6.11*exp((17.269*($td+$ckvn)-4717.3) / (($td+$ckvn)-35.86));
    $rmix = (0.622*$evap)/($pres-$evap); //!Mixing Ratio (kg/kg)
    $result = $rmix * 1000;
  }
  else
  {
    $result = NULL;
  }

  if (is_nan($result)) $result = NULL;

  return $result;
}

// LCL 고도의 기온값 산출
function fnGetLclTemp($pa, $ta, $td)
{
  $RCP=0.286;

  $ESTD = -2937.4/$td-4.9283*LOG10($td) + 23.5471;
  $ESTD = pow(10.0, $ESTD);
  $WS = 0.622*$ESTD/$pa;
  $PUP = $pa;
 
  $cond = true;
  while($cond) {
    $PUP = $PUP-1.;
    $TNEW = $ta*pow(($PUP/$pa), $RCP);
    $ESNEW = -2937.4/$TNEW-4.9283*LOG10($TNEW) + 23.5471;
    $ESNEW = pow(10., $ESNEW);
    $WSNEW = 0.622*$ESNEW/$PUP;
    if ($WS >= $WSNEW) {
      $PLCL = $PUP;
      $TLCL = $TNEW;
      return $TLCL;
    }
  }

  return $TLCL;
}

// 상당온위 산출
function fnGetEpt($pa, $ta, $mr, $tlcl)
{
  $result = NULL;

  $rr = $mr + 1.0*pow(10, -8);

  $power = (0.2854*(1.0 - (0.28*$rr)));
  $xx = $ta * pow((100000.0/$pa), $power);

  $p1 = (3.376/$tlcl) - 0.00254;
  $p2 = ($rr*1000.0) * (1.0 + 0.81*$rr);

  $result = $xx * exp($p1*$p2);

  return $result;
}

//=====================
// 기온과 이슬점온도로 상대습도 구한다.
//=====================
function fnGetRelativeHumidity($ta, $td)
{
  $result = NULL;
  if (is_nan($ta) || is_nan($td))
    return $result;

  $es = 6.112 * exp(((17.67 * $ta)/($ta + 243.5)));
  $e = 6.112 * exp(((17.67 * $td)/($td + 243.5)));

  $rh = ($e/$es) * 100;
  $result = $rh;

  if (is_nan($result)) $result = NULL;

  return $result;
}

//=====================
// 습구온도를 구한다. (Wet Bulb Temperature) //2019.11.19. 이창재
//=====================
function fnGetWetBulbTemperature($ta, $rh)
{
  $result = NULL;

  if ($ta > -90 && $rh >= 0) //계산조건 수정. 2019.11.28. 이창재
  {
    $result = $ta * atan(0.151977 * sqrt($rh + 8.313659)) + atan($ta + $rh) - atan($rh - 1.676331) + 0.00391838 * pow($rh, 1.5) * atan(0.023101 * $rh) - 4.68035;
  }
  else
  {
    $result = NULL;
  } // end if

  if (is_nan($result)) $result = NULL;

  return $result;
}
?>