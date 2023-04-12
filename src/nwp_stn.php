<?
// 입력값 확인
$mode = $_REQUEST["mode"]; if ($mode == "") $mode = "graph";
?>
<!DOCTYPE HTML>
<HTML>
<HEAD>
<title>수치모델 지점값 비교검증</title>
<meta http-equiv="Content-Type" content="text/html; charset=EUC-KR"/>
<meta http-equiv='X-UA-Compatible' content='IE=edge'/>

<script language="javascript" src="/sys/js/dateutil.js"></script>
<script language="javascript" src="/sys/js/popupCalendar.js"></script>

<link rel="stylesheet" type="text/css" href="/lsp/htdocs/css/fontawesome/css/all.css"/>
<link rel="stylesheet" href="./style.css?<?=date('Ymdhis')?>">

<script src="../htdocs/js/d3.v5.min.js"></script>
<script src="./skewt_function.js?<?=date('Ymdhis')?>"></script>
<script src="./skewt.js?<?=date('Ymdhis')?>"></script>
<script type="text/javascript" src="./nwp_stn.js?<?=date('Ymdhis')?>"></script>

</HEAD>
<BODY onload='onLoad("<?=$mode?>");' onresize='fnBodyResize();' bgcolor=#ffffff topmargin=5 leftmargin=5 marginwidth=5 marginheight=5 style='overflow:hidden;' onkeydown='var key = doKey(event,0); if (key == 0) return false;' onkeyup='var key = doKey(event,1); if (key == 0) return false;'>

<div id=head style='position:relative; overflow:hidden; height:42px; Background-Color:#FFFFFF; display:flex; align-items:center; z-index:200;'>
  <div style='min-width:10px;'></div>
  <div><img src='http://afs.kma.go.kr/htdocsStm/images/ptl/logo.png'></div>
  <div style='min-width:4px;'></div>
  <div style='font-weight:bold; font-size:18px; font-family:Nanum Gothic, sans-serif; white-space:nowrap;'>수치모델 비교/검증</div>
  <div style='min-width:40px;'></div>
  <div id=button_G class=button style="width:110px;" onclick="menu_init('graph');">
    <div id=text_G style='position:relative; top:5px; font-size:16px;'>
      그래프 <i class="fas fa-external-link-alt" style='position:relative; top:-1px;' title="새 창" onclick="window.open('/cht_new/cht_portal.php?cht_mode=nwp_stn','_blank'); event.stopPropagation(); return false;"></i>
    </div>
  </div>
  <div style='min-width:10px;'></div>
  <div id=button_S class=button style="width:110px;" onclick="menu_init('skew');">
    <div id=text_S style='position:relative; top:5px; font-size:16px;'>
      단열선도 <i class="fas fa-external-link-alt" style='position:relative; top:-1px;' title="새 창" onclick="window.open('/cht_new/cht_portal.php?cht_mode=skew','_blank'); event.stopPropagation(); return false;"></i>
    </div>
  </div>
  <div style='min-width:10px;'></div>
  <div><input id=button_V type=button class=button style="width:110px;" onclick="alert('추후 제공됩니다.');" value="연직시계열"></div>
</div>

<!-- 메뉴 -->
<div id=menu style='position:relative; overflow:hidden; z-index:200;'>
<table cellpadding=0 cellspacing=0 border=0 width=100% class=T02_Style01 style='z-index:200;'>
<tr>
  <td nowrap class=T02_List01>
    <table border=0 cellpadding=0 cellspacing=0 align=left>
    <!-- 1번째 줄 -->
    <tr>
      <td nowrap>
        <table border=0 cellpadding=0 cellspacing=0 align=left>
        <tr class=T02_Title02>
          <td nowrap>&middot;&nbsp;지점&nbsp;</td>
          <td nowrap width=4></td> 
          <td nowrap style='display:flex;'> 
            <div id=tms_stn1 class='select-style'></div>
          </td>
          <td nowrap width=2></td> 
          <td nowrap style='display:flex;'> 
            <div id=tms_stn2 class='select-style'></div>
          </td>

          <td nowrap width=10></td>
          <td nowrap>&middot;&nbsp;발표시각&nbsp;</td>
          <td nowrap width=4></td> 
          <td nowrap><input type=button class=TB08 style="background-color:#ffffff;" onfocus=blur() onmouseup="tm_init(1);" value=' NOW '></td>
          <td nowrap width=5></td> 
          <td nowrap><input type=text name="tm" id="tm" class=TimeBox style='width:125px;' size=15 maxlength=17 onkeypress="tm_input();" value=0></td>
          <td nowrap style="cursor:hand; position:relative; top:2px;" onclick="calendarPopup('tm',calPress);"><img src="/images/calendar.gif" border=0></td>
          <td nowrap width=5></td>
          <td nowrap class=TB09 style="background-color:#d4f3ff; width:30px;" onmouseup="tm_move('-24H');">-1D</td>
          <td nowrap width=1></td> 
          <td nowrap class=TB09 style="background-color:#d4f3ff; width:30px;" onmouseup="tm_move('-12H');">-12H</td>
          <td nowrap width=1></td> 
          <td nowrap class=TB09 style="background-color:#ffdfd5; width:30px;" onmouseup="tm_move('+12H');">+12H</td>
          <td nowrap width=1></td> 
          <td nowrap class=TB09 style="background-color:#ffdfd5; width:30px;" onmouseup="tm_move('+24H');">+1D</td>

          <td nowrap width=20></td>
          <td><div id="dynamic-y-control"><input type="checkbox" id="dynamic-y" onclick="fnChartDisp();" value="1" checked>&nbsp;<label for="dynamic-y" class=text1>y축 스케일 자동조정</label></div></td>

          <td nowrap width=20></td>
          <td>
            <div id="old_view"><input type=button class=TB08 style="font-size:8pt; background-color:#EEEEEE; width:80px; height:20px; border-radius:3px; display:none;" onclick="old_view();" value='(구)버전 이동'></div>
          </td>
        </tr>
        </table>
      </td>
    </tr>
    </table>

  </td>
</tr>
</table>
</div>

<!-- 바디 -->
<div id=body style='overflow-x:hidden; overflow-y:auto;' onscroll='fnBodyScroll();'>
  <div style='height:10px;'></div>

  <div id=graph_container style='display:flex; overflow:hidden;'>
    <div style='min-width:10px;'></div>
    <div id=left_menu style='white-space:nowrap; border-right:0px black solid;'>
      <div style='height:4px;'></div>
      <div style='font-weight:bold;'>[자료 선택(발표시각)]</div>

      <div style='height:4px;'></div>
      <div>
        <table cellpadding=0 cellspacing=0 border=0>
          <tr>  
            <td style='font-weight:bold; height:16px; min-width:55px;' nowrap></td>
            <td style='font-weight:bold; min-width:30px; vertical-align:top;' nowrap>전체</td>
            <td style='font-weight:bold; min-width:32px; vertical-align:top;' nowrap>-00H</td>
            <td style='font-weight:bold; min-width:32px; vertical-align:top;' nowrap>-12H</td>
            <td style='font-weight:bold; min-width:32px; vertical-align:top;' nowrap>-24H</td>
            <td style='font-weight:bold; min-width:32px; vertical-align:top;' nowrap>-36H</td>
            <td style='font-weight:bold; min-width:32px; vertical-align:top;' nowrap>-48H</td>
          </tr>

          <tr>  
            <td style='font-weight:bold; position:relative; top:-2px;' nowrap>KIM</td>
            <td nowrap>&nbsp;<input type="checkbox" value="GKIM" onclick="offset_select_all(this.checked, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GKIM_offset value="0"  onclick="offset_select(this.checked, this.name, this.value);" checked></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GKIM_offset value="12" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GKIM_offset value="24" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GKIM_offset value="36" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GKIM_offset value="48" onclick="offset_select(this.checked, this.name, this.value);"></td>
          </tr>

          <tr>  
            <td style='font-weight:bold; position:relative; top:-2px;' nowrap>UM</td>
            <td nowrap>&nbsp;<input type="checkbox" value="GDPS" onclick="offset_select_all(this.checked, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GDPS_offset value="0"  onclick="offset_select(this.checked, this.name, this.value);" checked></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GDPS_offset value="12" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GDPS_offset value="24" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GDPS_offset value="36" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=GDPS_offset value="48" onclick="offset_select(this.checked, this.name, this.value);"></td>
          </tr>

          <tr>  
            <td style='font-weight:bold; position:relative; top:-2px;' nowrap>ECMWF</td>
            <td nowrap>&nbsp;<input type="checkbox" value="ECMW" onclick="offset_select_all(this.checked, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=ECMW_offset value="0"  onclick="offset_select(this.checked, this.name, this.value);" checked></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=ECMW_offset value="12" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=ECMW_offset value="24" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=ECMW_offset value="36" onclick="offset_select(this.checked, this.name, this.value);"></td>
            <td nowrap>&nbsp;&nbsp;<input type="checkbox" name=ECMW_offset value="48" onclick="offset_select(this.checked, this.name, this.value);"></td>
          </tr>
        </table>
      </div>

      <div style='height:20px;'></div>
      <div>표출을 원하는 자료를 선택하세요</div>

      <div style='height:12px;'></div>
      <div style='display:flex;'>
        <div class='select-button selected' data-value='TMP' onclick='chart_select(this);'>기온/이슬점온도</div>
        <div style='min-width:6px;'></div>
        <div class='select-button' data-value='WND' onclick='chart_select(this);'>바람</div>
        <div style='min-width:6px;'></div>
        <div class='select-button selected' data-value='RNSN' onclick='chart_select(this);'>강수량</div>
      </div>
      <div style='height:6px;'></div>
      <div style='display:flex;'>
        <div class='select-button' data-value='GPH' onclick='chart_select(this);'>지위고도/해면기압</div>
        <div style='min-width:6px;'></div>
        <div class='select-button' data-value='EPOT' onclick='chart_select(this);'>상당온위</div>
      </div>

      <div style='height:20px;'></div>
      <div>드래그하여 순서를 바꿀 수 있습니다.</div>

      <div id=drag_menu class=drag>
        <div style='height:12px;'></div>
        <div id=select_TMP draggable=true class=box style='border:1px solid skyblue; padding:6px 4px 4px 4px;'>
          <div style='display:flex;'>
            <div style='font-weight:bold;'>[기온]</div>
            <div style='min-width:60px;'></div>
            <input type="checkbox" name=split id="TMP_split" onclick="chart_split(this.id, this.checked);">
            <div style='min-width:4px;'></div>
            <div style='font-weight:bold; color:red;'>연직층별 표출</div>
          </div>

          <div style='height:4px;'></div>
          <div>
            <table cellpadding=0 cellspacing=0 border=0>
              <tr>  
                <td style='font-weight:bold; min-width:35px;' nowrap>전체</td>
                <td style='font-weight:bold; min-width:55px;' nowrap>구분</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>관측</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>KIM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>UM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>ECMWF</td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="T:500" onclick="data_select_all(this.checked, this.value);"></td>
                <td>500hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:T:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:T:500" onclick="data_select(this.checked, this.value);" checked></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:T:500" onclick="data_select(this.checked, this.value);" checked></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:T:500" onclick="data_select(this.checked, this.value);" checked></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="T:700" onclick="data_select_all(this.checked, this.value);"></td>
                <td>700hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:T:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:T:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:T:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:T:700" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="T:850" onclick="data_select_all(this.checked, this.value);"></td>
                <td>850hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:T:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:T:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:T:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:T:850" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="T:925" onclick="data_select_all(this.checked, this.value);"></td>
                <td>925hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:T:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:T:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:T:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:T:925" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="T:1000" onclick="data_select_all(this.checked, this.value);"></td>
                <td>1000hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:T:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:T:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:T:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:T:1000" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="T:0" onclick="data_select_all(this.checked, this.value);"></td>
                <td>지상</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:T:0:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:T:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:T:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:T:0" onclick="data_select(this.checked, this.value);"></td>
              </tr>
            </table>
          </div>

          <div style='height:12px;'></div>
          <div style='font-weight:bold;'>[이슬점온도]</div>

          <div style='height:4px;'></div>
          <div>
            <table cellpadding=0 cellspacing=0 border=0>
              <tr>  
                <td style='font-weight:bold; min-width:35px;' nowrap>전체</td>
                <td style='font-weight:bold; min-width:55px;' nowrap>구분</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>관측</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>KIM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>UM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>ECMWF</td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="TD:500" onclick="data_select_all(this.checked, this.value);"></td>
                <td>500hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:TD:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:TD:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:TD:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:TD:500" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="TD:700" onclick="data_select_all(this.checked, this.value);"></td>
                <td>700hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:TD:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:TD:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:TD:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:TD:700" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="TD:850" onclick="data_select_all(this.checked, this.value);"></td>
                <td>850hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:TD:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:TD:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:TD:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:TD:850" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="TD:925" onclick="data_select_all(this.checked, this.value);"></td>
                <td>925hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:TD:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:TD:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:TD:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:TD:925" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="TD:1000" onclick="data_select_all(this.checked, this.value);"></td>
                <td>1000hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:TD:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:TD:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:TD:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:TD:1000" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="TD:0" onclick="data_select_all(this.checked, this.value);"></td>
                <td>지상</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:TD:0:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:TD:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:TD:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:TD:0" onclick="data_select(this.checked, this.value);"></td>
              </tr>
            </table>
          </div>

          <div style='height:12px;'></div>
          <div style='font-weight:bold;'>[습구온도]</div>

          <div style='height:4px;'></div>
          <div>
            <table cellpadding=0 cellspacing=0 border=0>
              <tr>  
                <td style='font-weight:bold; min-width:35px;' nowrap>전체</td>
                <td style='font-weight:bold; min-width:55px;' nowrap>구분</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>관측</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>KIM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>UM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>ECMWF</td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="TW:0" onclick="data_select_all(this.checked, this.value);"></td>
                <td>지상</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:TW:0:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:TW:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:TW:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:TW:0" onclick="data_select(this.checked, this.value);"></td>
              </tr>
            </table>
          </div>
        </div>

        <div id=select_WND draggable=true class=box style='border:1px solid skyblue; padding:6px 4px 4px 4px; display:none;'>
          <div style='font-weight:bold;'>[바람]</div>

          <div style='height:4px;'></div>
          <div>
            <table cellpadding=0 cellspacing=0 border=0>
              <tr>  
                <td style='font-weight:bold; min-width:35px;' nowrap>전체</td>
                <td style='font-weight:bold; min-width:55px;' nowrap>구분</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>관측</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>KIM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>UM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>ECMWF</td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="WND:500" onclick="data_select_all(this.checked, this.value);"></td>
                <td>500hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:WND:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:WND:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:WND:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:WND:500" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="WND:700" onclick="data_select_all(this.checked, this.value);"></td>
                <td>700hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:WND:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:WND:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:WND:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:WND:700" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="WND:850" onclick="data_select_all(this.checked, this.value);"></td>
                <td>850hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:WND:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:WND:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:WND:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:WND:850" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="WND:925" onclick="data_select_all(this.checked, this.value);"></td>
                <td>925hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:WND:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:WND:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:WND:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:WND:925" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="WND:1000" onclick="data_select_all(this.checked, this.value);"></td>
                <td>1000hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:WND:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:WND:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:WND:1000" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:WND:1000" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="WND:0" onclick="data_select_all(this.checked, this.value);"></td>
                <td>지상</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:WND:0:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:WND:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:WND:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:WND:0" onclick="data_select(this.checked, this.value);"></td>
              </tr>
            </table>
          </div>
        </div>

        <div id=select_RNSN draggable=true class=box style='border:1px solid skyblue; padding:6px 4px 4px 4px;'>
          <div style='font-weight:bold;'>[강수량]</div>

          <div style='height:4px;'></div>
          <div>
            <table cellpadding=0 cellspacing=0 border=0>
              <tr>  
                <td style='font-weight:bold; min-width:35px;' nowrap>전체</td>
                <td style='font-weight:bold; min-width:55px;' nowrap>구분</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>관측</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>KIM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>UM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>ECMWF</td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="RNAC:0" onclick="data_select_all(this.checked, this.value);"></td>
                <td>지상</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:RNAC:0:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:RNAC:0" onclick="data_select(this.checked, this.value);" checked></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:RNAC:0" onclick="data_select(this.checked, this.value);" checked></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:RNAC:0" onclick="data_select(this.checked, this.value);" checked></td>
              </tr>
            </table>
          </div>
        </div>

        <div id=select_GPH draggable=true class=box style='border:1px solid skyblue; padding:6px 4px 4px 4px; display:none;'>
          <div style='display:flex;'>
            <div style='font-weight:bold;'>[지위고도]</div>
            <div style='min-width:36px;'></div>
            <input type="checkbox" name=split id="GPH_split" onclick="chart_split(this.id, this.checked);" checked>
            <div style='min-width:4px;'></div>
            <div style='font-weight:bold; color:red;'>연직층별 표출</div>
          </div>

          <div style='height:4px;'></div>
          <div>
            <table cellpadding=0 cellspacing=0 border=0>
              <tr>  
                <td style='font-weight:bold; min-width:35px;' nowrap>전체</td>
                <td style='font-weight:bold; min-width:55px;' nowrap>구분</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>관측</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>KIM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>UM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>ECMWF</td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="GH:200" onclick="data_select_all(this.checked, this.value);"></td>
                <td>200hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:GH:200" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:GH:200" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:GH:200" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:GH:200" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="GH:500" onclick="data_select_all(this.checked, this.value);"></td>
                <td>500hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:GH:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:GH:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:GH:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:GH:500" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="GH:700" onclick="data_select_all(this.checked, this.value);"></td>
                <td>700hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:GH:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:GH:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:GH:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:GH:700" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="GH:850" onclick="data_select_all(this.checked, this.value);"></td>
                <td>850hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:GH:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:GH:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:GH:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:GH:850" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="GH:925" onclick="data_select_all(this.checked, this.value);"></td>
                <td>925hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:GH:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:GH:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:GH:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:GH:925" onclick="data_select(this.checked, this.value);"></td>
              </tr>
            </table>
          </div>

          <div style='height:12px;'></div>
          <div style='font-weight:bold;'>[해면기압]</div>

          <div style='height:4px;'></div>
          <div>
            <table cellpadding=0 cellspacing=0 border=0>
              <tr>  
                <td style='font-weight:bold; min-width:35px;' nowrap>전체</td>
                <td style='font-weight:bold; min-width:55px;' nowrap>구분</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>관측</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>KIM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>UM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>ECMWF</td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="PSL:0" onclick="data_select_all(this.checked, this.value);"></td>
                <td>지상</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:PSL:0:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:PSL:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:PSL:0" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:PSL:0" onclick="data_select(this.checked, this.value);"></td>
              </tr>
            </table>
          </div>
        </div>

        <div id=select_EPOT draggable=true class=box style='border:1px solid skyblue; padding:6px 4px 4px 4px; display:none;'>
          <div style='display:flex;'>
            <div style='font-weight:bold;'>[상당온위]</div>
            <div style='min-width:36px;'></div>
            <input type="checkbox" name=split id="EPOT_split" onclick="chart_split(this.id, this.checked);">
            <div style='min-width:4px;'></div>
            <div style='font-weight:bold; color:red;'>연직층별 표출</div>
          </div>

          <div style='height:4px;'></div>
          <div>
            <table cellpadding=0 cellspacing=0 border=0>
              <tr>  
                <td style='font-weight:bold; min-width:35px;' nowrap>전체</td>
                <td style='font-weight:bold; min-width:55px;' nowrap>구분</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>관측</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>KIM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>UM</td>
                <td style='font-weight:bold; min-width:35px;' nowrap>ECMWF</td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="EPOT:500" onclick="data_select_all(this.checked, this.value);"></td>
                <td>500hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:EPOT:500:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:EPOT:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:EPOT:500" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:EPOT:500" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="EPOT:700" onclick="data_select_all(this.checked, this.value);"></td>
                <td>700hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:EPOT:700:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:EPOT:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:EPOT:700" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:EPOT:700" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="EPOT:850" onclick="data_select_all(this.checked, this.value);"></td>
                <td>850hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:EPOT:850:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:EPOT:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:EPOT:850" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:EPOT:850" onclick="data_select(this.checked, this.value);"></td>
              </tr>
              <tr>  
                <td>&nbsp;<input type="checkbox" value="EPOT:925" onclick="data_select_all(this.checked, this.value);"></td>
                <td>925hPa</td>
                <td>&nbsp;<input type="checkbox" name=data value="OBS:EPOT:925:" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GKIM:EPOT:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="GDPS:EPOT:925" onclick="data_select(this.checked, this.value);"></td>
                <td>&nbsp;<input type="checkbox" name=data value="ECMW:EPOT:925" onclick="data_select(this.checked, this.value);"></td>
              </tr>
            </table>
          </div>
        </div>

      </div>
    </div>

    <div style='min-width:10px;'></div>
    <div>
      <div id=timediv style='position:relative; z-index:200;'></div>
      <div id=chartdiv style='position:relative; width:1000px; height:650px; overflow-y:auto; overflow-x:hidden;'></div>
    </div>

    <div style='min-width:8px;'></div>
    <div id=legenddiv style='overflow-y:auto; height:550px; width:150px; margin-top:50px;'></div>
  </div>

  <div id=skew_container style='display:flex; overflow:hidden;' onscroll='tmbarScroll();'>
    <div style='min-width:10px;'></div>
    <div style='display:flex;'>
      <div>
        <div style='min-height:4px;'></div>
        <div style='font-weight:bold;'>[자료 선택]</div>

        <div style='min-height:10px;'></div>
        <div style='display:flex; font-weight:bold;'>
          <div><input type=button class=TB08 style='background-color:#ffffff;width:41px;height:20px;font-size:8pt;border-radius:2px;' value=' 비교1 ' title='KIM/UM 비교' onClick="mdl_comp(1);"></div>
          <div style='min-width:4px;'></div>
          <div><input type=button class=TB08 style='background-color:#ffffff;width:41px;height:20px;font-size:8pt;border-radius:2px;' value=' 비교2 ' title='KIM/ECMWF 비교' onClick="mdl_comp(2);"></div>
          <div style='min-width:4px;'></div>
          <div><input type=button class=TB08 style='background-color:#ffffff;width:41px;height:20px;font-size:8pt;border-radius:2px;' value=' 비교3 ' title='UM/ECMWF 비교' onClick="mdl_comp(3);"></div>
          <div style='min-width:4px;'></div>
          <div><input type=button class=TB08 style='background-color:#ffffff;width:41px;height:20px;font-size:8pt;border-radius:2px;' value=' 비교4 ' title='KIM/UM/ECMWF 비교' onClick="mdl_comp(4);"></div>
        </div>

        <div style='min-height:10px;'></div>
        <div>
          <table cellpadding=0 cellspacing=0 border=0>
            <tr>  
              <td style='font-weight:bold; height:20px; min-width:30px;' nowrap>표출</td>
              <td style='font-weight:bold; min-width:85px;' nowrap></td>
              <td style='font-weight:bold; min-width:75px;' nowrap>구분</td>
              <td style='font-weight:bold; min-width:60px;' nowrap>발표시각 (관측은 관측시각)</td>
            </tr>

            <tr>  
              <td style='height:24px;'>&nbsp;<input type="checkbox" id=skew1 name=skew onclick="fnSkewSelect(this.checked, 1);" checked></td>
              <td style='font-weight:bold;' nowrap><i style='color:red;' class='fas fa-circle'></i>&nbsp;단열선도 1</td>
              <td style='font-weight:bold;' nowrap>
                <select id=model1 onChange='fnSkewSelect(skew1.checked, 1);' class='text3 prevent-keydown'>
                  <option value='GKIM'>KIM</option>
                  <option value='UM'>UM</option>
                  <option value='ECMWF'>ECMWF</option>
                  <option value='OBS'>관측</option>
                </select>
              </td>
              <td style='font-weight:bold;' nowrap>
                <select id=offset1 onChange='fnSkewSelect(skew1.checked, 1);' class='text3 prevent-keydown'>
                  <option value=0>-00H</option>
                  <option value=6>-06H</option>
                  <option value=12>-12H</option>
                  <option value=24>-24H</option>
                  <option value=36>-36H</option>
                  <option value=48>-48H</option>
                </select>
              </td>
            </tr>

            <tr>  
              <td style='height:24px;'>&nbsp;<input type="checkbox" id=skew2 name=skew onclick="fnSkewSelect(this.checked, 2);"></td>
              <td style='font-weight:bold;' nowrap><i style='color:blue;' class='fas fa-circle'></i>&nbsp;단열선도 2</td>
              <td style='font-weight:bold;' nowrap>
                <select id=model2 onChange='fnSkewSelect(skew2.checked, 2);' class='text3 prevent-keydown'>
                  <option value='GKIM'>KIM</option>
                  <option value='UM'>UM</option>
                  <option value='ECMWF'>ECMWF</option>
                  <option value='OBS'>관측</option>
                </select>
              </td>
              <td style='font-weight:bold;' nowrap>
                <select id=offset2 onChange='fnSkewSelect(skew2.checked, 2);' class='text3 prevent-keydown'>
                  <option value=0>-00H</option>
                  <option value=6>-06H</option>
                  <option value=12>-12H</option>
                  <option value=24>-24H</option>
                  <option value=36>-36H</option>
                  <option value=48>-48H</option>
                </select>
              </td>
            </tr>

            <tr>  
              <td style='height:24px;'>&nbsp;<input type="checkbox" id=skew3 name=skew onclick="fnSkewSelect(this.checked, 3);"></td>
              <td style='font-weight:bold;' nowrap><i style='color:green;' class='fas fa-circle'></i>&nbsp;단열선도 3</td>
              <td style='font-weight:bold;' nowrap>
                <select id=model3 onChange='fnSkewSelect(skew3.checked, 3);' class='text3 prevent-keydown'>
                  <option value='GKIM'>KIM</option>
                  <option value='UM'>UM</option>
                  <option value='ECMWF'>ECMWF</option>
                  <option value='OBS'>관측</option>
                </select>
              </td>
              <td style='font-weight:bold;' nowrap>
                <select id=offset3 onChange='fnSkewSelect(skew3.checked, 3);' class='text3 prevent-keydown'>
                  <option value=0>-00H</option>
                  <option value=6>-06H</option>
                  <option value=12>-12H</option>
                  <option value=24>-24H</option>
                  <option value=36>-36H</option>
                  <option value=48>-48H</option>
                </select>
              </td>
            </tr>

            <tr>  
              <td style='height:24px;'>&nbsp;<input type="checkbox" id=skew4 name=skew onclick="fnSkewSelect(this.checked, 4);"></td>
              <td style='font-weight:bold;' nowrap><i style='color:purple;' class='fas fa-circle'></i>&nbsp;단열선도 4</td>
              <td style='font-weight:bold;' nowrap>
                <select id=model4 onChange='fnSkewSelect(skew4.checked, 4);' class='text3 prevent-keydown'>
                  <option value='GKIM'>KIM</option>
                  <option value='UM'>UM</option>
                  <option value='ECMWF'>ECMWF</option>
                  <option value='OBS'>관측</option>
                </select>
              </td>
              <td style='font-weight:bold;' nowrap>
                <select id=offset4 onChange='fnSkewSelect(skew4.checked, 4);' class='text3 prevent-keydown'>
                  <option value=0>-00H</option>
                  <option value=6>-06H</option>
                  <option value=12>-12H</option>
                  <option value=24>-24H</option>
                  <option value=36>-36H</option>
                  <option value=48>-48H</option>
                </select>
              </td>
            </tr>
          </table>
        </div>

        <div style='min-width:374px;'>
          <div style='height:20px;'></div>
          <div style='display:flex;'>
            <div id='skew_index' class='select-button selected' onclick='skew_ext(this);'><i class="fas fa-eye"></i> 불안정지수</div>
            <div style='min-width:10px;'></div>
            <div id='skew_change' class='select-button' onclick='skew_ext(this);'><i class="fas fa-edit"></i> BASE 고도 & 값 변경</div>
            <div style='min-width:10px;'></div>
            <div id='skew_reset' class='select-button' onclick='skew_ext(this);'><i class="fas fa-retweet"></i> 초기화</div>
          </div>
          <div style='height:20px;'></div>
          <div id='skew_table_button' style='display:flex;'>
            <div><input type=button class=TB08 id=button1 style='width:64px;height:20px;font-size:8pt;border:0.5px solid gray;visibility:hidden;border-radius:2px;' value=' 단열선도 1 ' onClick="tableSelect(1);"></div>
            <div style='min-width:4px;'></div>
            <div><input type=button class=TB08 id=button2 style='width:64px;height:20px;font-size:8pt;border:0.5px solid gray;visibility:hidden;border-radius:2px;' value=' 단열선도 2 ' onClick="tableSelect(2);"></div>
            <div style='min-width:4px;'></div>
            <div><input type=button class=TB08 id=button3 style='width:64px;height:20px;font-size:8pt;border:0.5px solid gray;visibility:hidden;border-radius:2px;' value=' 단열선도 3 ' onClick="tableSelect(3);"></div>
            <div style='min-width:4px;'></div>
            <div><input type=button class=TB08 id=button4 style='width:64px;height:20px;font-size:8pt;border:0.5px solid gray;visibility:hidden;border-radius:2px;' value=' 단열선도 4 ' onClick="tableSelect(4);"></div>
            <div style='min-width:10px;'></div>
            <div id='skew_edit' style='width:64px; height:20px; font-size:8pt; border-radius:2px; border:0.5px solid gray; visibility:hidden;' class=TB08 onclick='fnSkewEdit();'>
              <i class="fas fa-edit" title="수정"></i>&nbsp;값 수정
            </div>
          </div>
          <div style='height:10px;'></div>
          <div id='skew_table'></div>
          <div style='height:20px;'></div>
          <div id='skew_index_table'></div>
          <div style='height:20px;'></div>
          <div id='skew_hail_table'></div>
        </div>
      </div>

      <div style='min-width:15px;'></div>
      <div style='min-width:15px;'></div>
      <div>
        <div style='min-height:10px;'></div>
        <div style='display:flex;'>
          <div id='tmbar' style='width:750px; height:15px; background-color:lightblue; cursor:pointer; visibility:hidden;' onmousemove="tmbarHover(event, this);" onmouseout="document.getElementById('tmpop1').style.visibility = 'hidden';" onclick="tmbarClick(event, this);"></div>
          <div id='tmbarCtr' style='display:flex; visibility:hidden;'>
            <div style='min-width:4px;'></div>
            <div><i class='fas fa-step-backward' id=ani_back style='cursor:pointer;' onclick="tmbarPlay(-1);"></i></div>
            <div style='min-width:4px;'></div>
            <div><i class='fas fa-step-forward' id=ani_forward style='cursor:pointer;' onclick="tmbarPlay(1);"></i></div>
          </div>
          <div id='tmpop1' class=pop style='width:35px; height:15px; background-color:lightyellow; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmpop2' class=pop style='width:35px; height:15px; background-color:lightyellow; position:absolute; z-index:100; visibility:hidden;'></div>
          <div id='tmpop3' style='width:5px; height:15px; background-color:lightgreen; position:absolute; z-index:100; visibility:hidden;'></div>

          <div id='tmline1' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline2' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline3' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline4' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline5' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline6' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline7' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline8' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline9' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline10' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline11' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline12' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline13' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline14' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
          <div id='tmline15' class=tmline style='height:15px; border-right:1px dashed navy; position:absolute; z-index:200; visibility:hidden;'></div>
        </div>

        <div style='height:2px;'></div>
        <div id='data_info' class=text1 style='font-size:10pt; font-weight:bold;'></div>

        <div id='skew' style='display:flex;'>
          <div id='skew_image' style='min-width:750px;'></div>
        </div>
      </div>
    </div>
  </div>

</div>
<!-- 바디 끝 -->

<div id=loading style='position:absolute; top:0px; left:0px; z-index:1100; width:100%; height:100%; background-color:#eeeeee; opacity:0.5; text-align:center; vertical-align:middle; display:none;'>
  <div class=_ku_LoadingBar></div>
</div>

<!-- 공지사항 -->
<div id='notice' style='position:absolute; top:300px; left:400px; width:500px; border:1px solid black; background-color:#ffffff; padding:10px; z-index:99; display:none;'>

    <div class='filter_point' style='margin:0 0 5px 0; display:flex;'>
        ▶ 공지사항
        <div style='margin-left:auto;'>
          <button class=TB08 style='height:20px; width:70px; font-size:8pt;' onclick="document.getElementById('notice').style.display='none';">닫기(ESC)</button>
        </div>
        <div style='min-width:2px;'></div>
    </div>

    <div style='height:5;'></div>
    <div class='filter_point' style='margin:0px 5px 5px 2px; font-weight:normal;'>
        해당 페이지는 운영 종료 예정입니다. (종료 예정일: 2022.1.31.)<br>
        수치모델 지점값 비교검증 페이지와 통합 운영 예정이오니, 참고 바랍니다.
    </div>
</div>

</BODY>
</HTML>