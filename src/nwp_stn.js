/*
  수치모델 비교검증 JS(vanilla, without jquery)
  작성자: 이창재(2021.06.14.)
*/
var tm_fc; // 발표 시각
//var host = "http://cht.kma.go.kr/";
var host = 'http://' + location.hostname + '/';
var disptype;

// 그래프 표출 관련 변수
// 변수 목록(option- 0:지상+고층, 1:지상, 2:고층)
var vars  = [
  {name: "T", option: 0},
  {name: "TD", option: 0},
  {name: "TW", option: 1},
  {name: "GH", option: 2},
  {name: "PSL", option: 1},
  {name: "RNAC", option: 1},
  {name: "WND", option: 0},
  {name: "EPOT", option: 2}
];
var levs   = [200, 500, 700, 850, 925, 1000, 0];
var models = ["GKIM", "GDPS", "ECMW", "OBS"];
var offsets = [-48, -36, -24, -12, 0];
var dataset = [], datainfo = [];
var input = [];
var count = 0;

var chart_list = [
  {name: "TMP", disp:1, height:450, vars:["T","TD","TW"], unit:"℃", text:"기온/이슬점온도", level:-1, split:0, sort:0}, 
  {name: "TMP", disp:0, height:350, vars:["T","TD"], unit:"℃", text:"기온/이슬점온도", level:500, sort:0}, 
  {name: "TMP", disp:0, height:350, vars:["T","TD"], unit:"℃", text:"기온/이슬점온도", level:700, sort:0}, 
  {name: "TMP", disp:0, height:350, vars:["T","TD"], unit:"℃", text:"기온/이슬점온도", level:850, sort:0}, 
  {name: "TMP", disp:0, height:350, vars:["T","TD"], unit:"℃", text:"기온/이슬점온도", level:925, sort:0}, 
  {name: "TMP", disp:0, height:350, vars:["T","TD","TW"], unit:"℃", text:"기온/이슬점온도", level:0, sort:0}, 
  {name: "WND", disp:0, height:80, vars:["WND"], unit:"kt", text:"바람", level:-1, split:0, sort:1}, 
  {name: "RNSN", disp:1, height:150, vars:["RNAC"], unit:"mm", text:"강수량", level:-1, split:0, sort:2}, 
  {name: "GPH", disp:0, height:350, vars:["GH","PSL"], unit:"gpm/hPa", text:"지위고도/해면기압", level:-1, split:1, sort:3}, 
  {name: "GPH", disp:0, height:350, vars:["GH"], unit:"gpm", text:"지위고도", level:200, sort:3}, 
  {name: "GPH", disp:0, height:350, vars:["GH"], unit:"gpm", text:"지위고도", level:500, sort:3}, 
  {name: "GPH", disp:0, height:350, vars:["GH"], unit:"gpm", text:"지위고도", level:700, sort:3}, 
  {name: "GPH", disp:0, height:350, vars:["GH"], unit:"gpm", text:"지위고도", level:850, sort:3}, 
  {name: "GPH", disp:0, height:350, vars:["GH"], unit:"gpm", text:"지위고도", level:925, sort:3}, 
  {name: "GPH", disp:0, height:350, vars:["PSL"], unit:"hPa", text:"해면기압", level:0, sort:3}, 
  {name: "EPOT", disp:0, height:350, vars:["EPOT"], unit:"K", text:"상당온위", level:-1, split:0, sort:4},
  {name: "EPOT", disp:0, height:350, vars:["EPOT"], unit:"K", text:"상당온위", level:500, sort:4}, 
  {name: "EPOT", disp:0, height:350, vars:["EPOT"], unit:"K", text:"상당온위", level:700, sort:4}, 
  {name: "EPOT", disp:0, height:350, vars:["EPOT"], unit:"K", text:"상당온위", level:850, sort:4}, 
  {name: "EPOT", disp:0, height:350, vars:["EPOT"], unit:"K", text:"상당온위", level:925, sort:4}
];
var tm1, tm2, line_tm1, line_tm2, bullet_tm1, bullet_tm2;
var transform = {x:0, y:0, k:0}, domain1, domain2;
var DEGRAD = Math.PI/180;

// 단열선도 관련 변수
var skew_dataset = [], skew_disp = [];
var skewt;
var skew_count = 0, nskew_max = 4, table_button = 0;
var tm_ef = 0; // 발효 시각

var reg_arr = [
  {reg_name: "수도권", reg_id: ["11A0","11B1","11B2"], stn: []},
  {reg_name: "경남권", reg_id: ["11H2"], stn: []},
  {reg_name: "경북권", reg_id: ["11H1","11E0"], stn: []},
  {reg_name: "전남권", reg_id: ["11F2","21F2"], stn: []},
  {reg_name: "전북",  reg_id: ["11F1","21F1"], stn: []},
  {reg_name: "충남권", reg_id: ["11C2"], stn: []},
  {reg_name: "충북",  reg_id: ["11C1"], stn: []},
  {reg_name: "강원도",  reg_id: ["11D1","11D2"], stn: []},
  {reg_name: "제주도",  reg_id: ["11G0"], stn: []},
  {reg_name: "고층지점",  reg_id: ["UPP"], stn: []}
];
//document.addEventListener('load', onLoad(), false);

//IE에서 findIndex 함수 사용을 위한 polyfill
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, { kValue, k, O })).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    },
    configurable: true,
    writable: true
  });
}

// 로딩시 실행
function onLoad(opt) {
  disptype = opt;
  menu_init(disptype, -1);
  fnInitStn();
  fnInitDrag();
}

// 드래그 이벤트
function fnInitDrag() {
  var dragSrcEl = null;

  var items = document.querySelectorAll('.drag .box');

  for (var i=0; i<items.length; i++) {
    items[i].addEventListener('dragstart', handleDragStart, false);
    items[i].addEventListener('dragover', handleDragOver, false);
    items[i].addEventListener('dragenter', handleDragEnter, false);
    items[i].addEventListener('dragleave', handleDragLeave, false);
    items[i].addEventListener('dragend', handleDragEnd, false);
    items[i].addEventListener('drop', handleDrop, false);
  }
 
  function handleDragStart(e) {
    this.style.opacity = '0.4';
    
    dragSrcEl = this;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text', this.innerHTML);
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';
    
    return false;
  }

  function handleDragEnter(e) {
    this.classList.add('over');
  }

  function handleDragLeave(e) {
    this.classList.remove('over');
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation(); // stops the browser from redirecting.
    }
    
    if (dragSrcEl != this) {
      var thisid = this.id;
      var name = dragSrcEl.id.split("_")[1]; 
      var name1 = thisid.toString().split("_")[1];
      var n = chart_list.findIndex(function(x){return (x.name == name && x.level == -1)});
      var n1 = chart_list.findIndex(function(x){return (x.name == name1 && x.level == -1)});
      var sort = chart_list[n].sort;
      var sort1 = chart_list[n1].sort;

      for (var i=0; i<chart_list.length; i++) {
        if (chart_list[i].name == name) {
          chart_list[i].sort = sort1;
        }
        else if (chart_list[i].name == name1) {
          chart_list[i].sort = sort;
        }
      }

      chart_list.sort(function(a,b){
        return(a.sort<b.sort)?-1:(a.sort>b.sort)?1:0;
      });

      //var swap = chart_list[n];
      //chart_list[n] = chart_list[n1];
      //chart_list[n1] = swap;

      swap = dragSrcEl.id;
      dragSrcEl.id = this.id;
      this.id = swap;

      dragSrcEl.innerHTML = this.innerHTML;
      this.innerHTML = e.dataTransfer.getData('text');

      var data = document.getElementsByName("data");
      for (var j=0; j<data.length; j++) {
        data[j].checked = false;
      }

      for (var i=0; i<datainfo.length; i++) {
        if (datainfo[i].disp == 1) {
          for (var j=0; j<data.length; j++) {
            if (data[j].value.split(":")[0] == datainfo[i].model && data[j].value.split(":")[1] == datainfo[i].name && data[j].value.split(":")[2] == datainfo[i].level) {
              data[j].checked = true;
            }
          }
        }
      }

      var data = document.getElementsByName("split");
      for (var j=0; j<data.length; j++) {
        data[j].checked = false;
      }

      for (var i=0; i<chart_list.length; i++) {
        if (chart_list[i].split != undefined && chart_list[i].split == 1) {
          document.getElementById(chart_list[i].name + "_split").checked = true;
        }
      }

      fnChartDisp();
    }
    
    return false;
  }

  function handleDragEnd(e) {
    this.style.opacity = '1';
    
    for (var i=0; i<items.length; i++) {
      items[i].classList.remove('over');
    }
  }
}

// 메뉴 설정(mode - -1: 첫 실행)
function menu_init(opt, mode) {
  disptype = opt;
  document.getElementById("button_G").classList.remove("active");
  document.getElementById("button_S").classList.remove("active");
  document.getElementById("button_V").classList.remove("active");
  document.getElementById("text_G").classList.remove("active_text");
  document.getElementById("text_S").classList.remove("active_text");
  //document.getElementById("text_V").classList.remove("active");

  if (opt == "graph") {
    document.getElementById("button_G").classList.add("active");
    document.getElementById("text_G").classList.add("active_text");
    document.getElementById("skew_container").style.display = "none";
    document.getElementById("graph_container").style.display = "flex";
    document.getElementById("dynamic-y-control").style.display = "block"; 
    //document.getElementById("old_view").style.display = "block"; 

    if (datainfo.length == 0) fnInitInfo();
  }
  else if (opt == "skew") {
    document.getElementById("button_S").classList.add("active");
    document.getElementById("text_S").classList.add("active_text");
    document.getElementById("skew_container").style.display = "flex";
    document.getElementById("graph_container").style.display = "none";
    document.getElementById("dynamic-y-control").style.display = "none"; 
    //document.getElementById("old_view").style.display = "none"; 

    //if (mode == -1) document.getElementById("notice").style.display = "block"; 
  }
  fnBodyResize();

  if (mode != -1) fnGetData();
}

// 초기 설정
function fnInitInfo() {
  for (var k=0; k<vars.length; k++) {
    for (var l=0; l<levs.length; l++) {
      if (vars[k].option == 1 && levs[l] > 0) continue;
      else if (vars[k].option == 2 && levs[l] == 0) continue;

      for (var i=0; i<models.length; i++) {
        for (var j=0; j<offsets.length; j++) {
          if (models[i] == "OBS" && offsets[j] < 0) continue;
          else {
            var n = datainfo.length;
            datainfo[n] = {};
            datainfo[n].model = models[i];
            datainfo[n].offset = offsets[j];
            datainfo[n].name  = vars[k].name;
            datainfo[n].level = levs[l];
            datainfo[n].disp  = 0;
          }
        }
      }
    }
  }
}

// 시계열 분포도 주요지점 옵션 생성
function fnInitStn() {
  var url = host + "/fgd/nwp_new/nwp_stn_lib.php?mode=1";
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.overrideMimeType("application/x-www-form-urlencoded; charset=euc-kr");
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4 || xhr.status != 200) return;
    else {
      var line = xhr.responseText.split('\n');
      if (xhr.responseText.length <= 1 && line[0] == "") {
        return;
      }

      line.forEach(function(l) {
        if (l[0] == "#" || l.length <= 1) {
          return;
        }

        var d = l.split(',');
        for (var i=0; i<reg_arr.length; i++) {
          for (var j=0; j<reg_arr[i].reg_id.length; j++) {
            if (d[1].indexOf(reg_arr[i].reg_id[j]) != -1) {
              var n = reg_arr[i].stn.length;
              reg_arr[i].stn[n] = {};
              reg_arr[i].stn[n].stn_id = d[3];
              reg_arr[i].stn[n].stn_ko = d[2];
              break;
            }
          }
        }
      });
    }

    var select_element = document.createElement("select");
    select_element.setAttribute('onchange', 'fnStnList(this.value); fnGetData(-1);');
    select_element.style.height = "20px";
    for (var i=0; i<reg_arr.length; i++) {
      var opt_element = document.createElement("option");
      opt_element.value = reg_arr[i].reg_name;
      opt_element.innerText = reg_arr[i].reg_name;
      select_element.appendChild(opt_element); 
    }
    document.getElementById("tms_stn1").appendChild(select_element); 

    var select_element = document.createElement("select");
    select_element.id = "select_stn";
    select_element.setAttribute('onchange', 'fnGetData(-1);');
    select_element.style.height = "20px";
    document.getElementById("tms_stn2").appendChild(select_element); 
    fnStnList(0);
    //select_element.classList.add("checkbox-style");
  };
  xhr.send();
}

// 시계열 분포도 주요지점 옵션 생성2
function fnStnList(reg_name) {  
  var item = document.getElementById("select_stn");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  for (var i=0; i<reg_arr.length; i++) {
    if (reg_arr[i].reg_name == reg_name || (reg_name == 0 && i == 0)) {
      for (var j=0; j<reg_arr[i].stn.length; j++) {
        if (reg_arr[i].stn[j].stn_id == -999) continue;
        var opt_element = document.createElement("option");
        opt_element.value = reg_arr[i].stn[j].stn_id;
        opt_element.innerText = reg_arr[i].stn[j].stn_ko + "(" + reg_arr[i].stn[j].stn_id + ")";
        document.getElementById("select_stn").appendChild(opt_element); 
      }
      break;
    }
  }

  if (reg_name == 0) tm_init(0);
}

//////////////////////////////////////////////////////////////////////////////////////////
//  시간제어
//////////////////////////////////////////////////////////////////////////////////////////
//  시간 입력
// ******시간 처리
// 달력(popupCalendar.js에서 callback)
function calPress() {
  var tm = targetId.value;
  tm = tm.substring(0,4) + tm.substring(5,7) + tm.substring(8,10) + tm.substring(11,13) + tm.substring(14,16);
  tm_fc = tm;
  fnGetData();
}

//  발표시간 입력 및 선택
function tm_input() {
  var tm = document.getElementById("tm").value;

  if (event.keyCode == 13) {
      if (tm.length != 16) {
          alert("시간 입력이 틀렸습니다. (년.월.일.시:분)");
          tm = tm_fc;
          document.getElementById("tm").value = tm.substring(0,4) + "." + tm.substring(4,6) + "." + tm.substring(6,8) + "." + tm.substring(8,10) + ":" + tm.substring(10,12);
          return;
      }else if (tm.charAt(4) != "." || tm.charAt(7) != "." || tm.charAt(10) != "." || tm.charAt(13) != ":") {
          alert("시간 입력 양식이 틀렸습니다. (년.월.일.시:분)");
          tm = tm_fc;
          document.getElementById("tm").value = tm.substring(0,4) + "." + tm.substring(4,6) + "." + tm.substring(6,8) + "." + tm.substring(8,10) + ":" + tm.substring(10,12);
          return;
      }else {
          var YY = tm.substring(0,4);
          var MM = tm.substring(5,7);
          var DD = tm.substring(8,10);
          var HH = tm.substring(11,13);
          var MI = tm.substring(14,16);

          err = 0;
          if (YY < 1990 || YY > 2100) err = 1;
          else if (MM < 1 || MM > 12) err = 2;
          else if (DD < 1 || DD > 31) err = 3;
          else if (HH < 0 || HH > 24) err = 4;
          else if (MI < 0 || MI > 60) err = 5;

          if (err > 0)
          {
            if      (err == 1) alert("년도가 틀렷습니다.(" + YY + ")");
            else if (err == 2) alert("월이 틀렸습니다.(" + MM + ")");
            else if (err == 3) alert("일이 틀렸습니다.(" + DD + ")");
            else if (err == 4) alert("시간이 틀렸습니다.(" + HH + ")");
            else if (err == 5) alert("분이 틀렸습니다.(" + MI + ")");

            tm = tm_fc;
            document.getElementById("tm").value = tm.substring(0,4) + "." + tm.substring(4,6) + "." + tm.substring(6,8) + "." + tm.substring(8,10) + ":" + tm.substring(10,12);
            return;
          }
      }

      var HH = parseInt(tm.substring(11,13));
      var MI = 0;
      tm = tm.substring(0,4) + tm.substring(5,7) + tm.substring(8,10) + addZeros(HH,2) + addZeros(MI,2);
      document.getElementById("tm").value = tm.substring(0,4) + "." + tm.substring(4,6) + "." + tm.substring(6,8) + "." + tm.substring(8,10) + ":" + tm.substring(10,12);
      tm_fc = tm;
      fnGetData();
  }else if (event.keyCode == 45 || event.keyCode == 46 || event.keyCode == 58) {
      event.returnValue = true;
  }else if (event.keyCode >= 48 && event.keyCode <= 57) {
      event.returnValue = true;
  }else {
      event.returnValue = false;
  }
}

//  최근시간(mode = 0:첫 로드 시)
function tm_init(mode) {
  var url = host + "/fgd/nwp_new/nwp_stn_lib.php?mode=0";
  console.log(url);

  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.overrideMimeType("application/x-www-form-urlencoded; charset=euc-kr");
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4 || xhr.status != 200) return;
    else {
      var line = xhr.responseText.split('\n');
      if (xhr.responseText.length <= 1 && line[0] == "") {
        return;
      }

      line.forEach(function(l) {
        if (l[0] == "#" || l.length <= 1) {
          return;
        }
        tm = l;
      });
    }

    document.getElementById("tm").value = tm.substring(0,4) + "." + tm.substring(4,6) + "." + tm.substring(6,8) + "." + tm.substring(8,10) + ":" + tm.substring(10,12);
    tm_fc = tm;
    fnGetData();
  };
  xhr.send();
}

// 시간 이동
function tm_move(moving, type) {
  var n = moving.length - 1;
  var mode = moving.charAt(n);
  var value = parseInt(moving);

  var tm = document.getElementById("tm").value;
  var YY = tm.substring(0,4);
  var MM = tm.substring(5,7);
  var DD = tm.substring(8,10);
  var HH = tm.substring(11,13);
  var MI = tm.substring(14,16);
  var date = new Date(YY, MM-1, DD, HH, MI);
  date.setTime(date.getTime() + value*60*60*1000);

  var tm = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2) + addZeros(date.getMinutes(),2);
  document.getElementById("tm").value = tm.substring(0,4) + "." + tm.substring(4,6) + "." + tm.substring(6,8) + "." + tm.substring(8,10) + ":" + tm.substring(10,12);
  tm_fc = tm;
  console.log(tm_fc);
  fnGetData();
}

// 숫자 자리수 맞춤
function addZeros(num, digit) {
  var zero = '';
  num = num.toString();
  if (num.length < digit) {
    for (var i=0; i < digit - num.length; i++) {
      zero += '0'
    }
  }
  return zero + num;
}

// 단열선도 API 호출
function fnSkewSelect(checked, idx) {
  if (checked == true) {
    if (skew_disp[idx-1] != undefined && skew_disp[idx-1] == 1) {
      skew_count--;
    }
    skew_disp[idx-1] = 1;
    fnSkewData(idx);
  }
  else {
    var data = document.getElementsByName("skew");
    var nskew = 0
    for (var i=0; i<data.length; i++) {
      if (data[i].checked == true) nskew++;
    }

    for (var i=0; i<skew_dataset.length; i++) {    
      skew_dataset[i].data[idx-1] = [];
    }

    if (skew_disp[idx-1] != undefined && skew_disp[idx-1] == 1) {
      skew_disp[idx-1] = 0;
      skew_count--;
      if (skew_count == nskew) fnSkewDisp();
    }
  }
}

// 단열선도 API 호출
function fnSkewData(idx) {
  document.getElementById("loading").style.display = "block";

  if (idx <= 0) skew_count = 0;

  var data = document.getElementsByName("skew");
  var nskew = 0
  for (var i=0; i<data.length; i++) {
    if (data[i].checked == true) {
      nskew++;
      if (idx <= 0) skew_disp[i] = 1;
    }
    else {
      if (idx <= 0) skew_disp[i] = 0;
    }
  }

  var offset = 0;
  for (var i=0; i<nskew_max; i++) {
    if (skew_disp[i] == undefined || skew_disp[i] == 0) continue;
    var value = document.getElementById("offset"+parseInt(i+1)).value * -1;
    if (value < offset) offset = value;
  }

  var tm = tm_fc;
  var YY = tm.substring(0,4);
  var MM = tm.substring(4,6);
  var DD = tm.substring(6,8);
  var HH = tm.substring(8,10);
  var MI = tm.substring(10,12);
  var date = new Date(YY, MM-1, DD, HH, MI);
  var date1 = new Date();
  var date2 = new Date();

  date1.setTime(date.getTime() + offset*60*60*1000);
  tm1 = addZeros(date1.getFullYear(),4) + addZeros(date1.getMonth()+1,2) + addZeros(date1.getDate(),2) + addZeros(date1.getHours(),2) + addZeros(date1.getMinutes(),2);  

  date2.setTime(date.getTime() + 288*60*60*1000);
  tm2 = addZeros(date2.getFullYear(),4) + addZeros(date2.getMonth()+1,2) + addZeros(date2.getDate(),2) + addZeros(date2.getHours(),2) + addZeros(date2.getMinutes(),2);  

  var urls = [];
  for (var i=0; i<nskew_max; i++) {
    if (idx <= 0) {
      if (skew_disp[i] == undefined || skew_disp[i] == 0) continue;
    }
    else if (idx > 0 && (i+1 != idx)) continue;
 
    for (var j=0; j<skew_dataset.length; j++) {    
      skew_dataset[j].data[i] = [];
    }

    var model = document.getElementById("model"+parseInt(i+1)).value;
    if (model == "OBS") {
      date.setTime(date.getTime() - document.getElementById("offset"+parseInt(i+1)).value*60*60*1000);
      tm = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2) + addZeros(date.getMinutes(),2);  

      urls[i] = host + "/fgd/nwp_new/nwp_stn_lib.php?mode=4&tm1=" + tm + "&tm2=" + tm2 + "&stn=" + parseInt(document.getElementById("select_stn").value);
    }
    else {
      var date = new Date(YY, MM-1, DD, HH, MI);

      date.setTime(date.getTime() - 9*60*60*1000 - document.getElementById("offset"+parseInt(i+1)).value*60*60*1000);
      tm = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2) + addZeros(date.getMinutes(),2);
      urls[i] = "/cgi-bin/url/nph-skew_img?tm=" + tm + "&model=" + model + "&stn_id=" + parseInt(document.getElementById("select_stn").value);
    }

    get_api_result(urls[i], i);
  }

  function get_api_result(url, k) {
    console.log(url);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.overrideMimeType("application/x-www-form-urlencoded; charset=euc-kr");
    xhr.onreadystatechange = function () {
      if (xhr.readyState != 4 || xhr.status != 200) return;
      else {
        var line = xhr.responseText.split('\n');
        if (line[0][0] == "@")  {
          skew_count++;
          if (skew_count == nskew) fnSkewDisp();
          return;
        }

        var json = JSON.parse(xhr.responseText);
        for (var i=0; i<json.length; i++) {
          if (document.getElementById("model"+parseInt(k+1)).value == "OBS") {
            var YY = json[i].tm_ef.substring(0,4);
            var MM = json[i].tm_ef.substring(4,6);
            var DD = json[i].tm_ef.substring(6,8);
            var HH = json[i].tm_ef.substring(8,10);
            var MI = json[i].tm_ef.substring(10,12);
            var date = new Date(YY, MM-1, DD, HH, MI);
            date.setTime(date.getTime() + document.getElementById("offset"+parseInt(k+1)).value*60*60*1000);
            json[i].tm_ef = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2);
          }

          var n = skew_dataset.findIndex(function(x){return (x.tm_ef == json[i].tm_ef)})
          if (n == -1) {
            n = skew_dataset.length;
            skew_dataset[n] = {};
            skew_dataset[n].tm_ef = json[i].tm_ef;
            skew_dataset[n].data = [];
          }
          skew_dataset[n].data[k] = json[i].data;
        }
        skew_count++;
      }

      if (skew_count == nskew) fnSkewDisp();
    };
    xhr.send();
  }
}

// 단열선도 표출
function fnSkewDisp() {
  document.getElementById("tmbarCtr").style.visibility = "hidden";

  var item = document.getElementById("skew_table");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  var item = document.getElementById("skew_index_table");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  var item = document.getElementById("skew_hail_table");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  var item = document.getElementById("skew_image");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  var tmline = document.querySelectorAll('.tmline');

  for (var i=0; i<tmline.length; i++) {
    tmline[i].style.visibility = "hidden";
  }

  for (var i=0; i<skew_dataset.length; i++) {
    var ok = 0;
    for (var j=0; j<skew_dataset[i].data.length; j++) {
      if (skew_dataset[i].data[j] == undefined) continue;
      else if (skew_dataset[i].data[j].length > 0) {
        ok++;

        if (skew_disp[j] == 0) {
          skew_dataset[i].data.splice(j,1);
          j--;
        }
      }
    }

    if (ok == 0) {
      skew_dataset.splice(i,1);
      i--;
    }
  }

  skew_dataset.sort(function(a,b){
    return(a.tm_ef<b.tm_ef)?-1:(a.tm_ef>b.tm_ef)?1:0;
  });

  console.log(skew_dataset);
  if (skew_dataset.length == 0) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("data_info").innerText = "자료가 없습니다.";
    document.getElementById('tmbar').style.visibility = "hidden";
    document.getElementById('tmpop2').style.visibility = "hidden";
    document.getElementById('tmpop3').style.visibility = "hidden";
    for (var i=0; i<nskew_max; i++) {
      document.getElementById("button"+parseInt(i+1)).style.visibility = "hidden";
    }

    return;
  }
  else {
    var k = 0;
    var tmbar = document.getElementById('tmbar');
    var length = parseFloat(tmbar.style.width)/skew_dataset.length;
    var top = tmbar.getBoundingClientRect().top;
    var left = tmbar.getBoundingClientRect().left;

    for (var i=1; i<skew_dataset.length; i++) {
      if (skew_dataset[i].tm_ef.substring(6,8) != skew_dataset[i-1].tm_ef.substring(6,8)) {
        k++;
        document.getElementById("tmline"+k).style.top = parseFloat(top) + "px";
        document.getElementById("tmline"+k).style.left = parseFloat(left + i*length) + "px";
        document.getElementById("tmline"+k).style.visibility = "visible";
      }    
    }
  }

  skewt = new SkewT('#skew_image', skew_dataset[0].data.length);

  document.getElementById("tmbarCtr").style.visibility = "visible";
  for (var i=0; i<nskew_max; i++) {
    if (skew_disp[i] == 1) {
      document.getElementById("button"+parseInt(i+1)).style.visibility = "visible";
    }
    else {
      document.getElementById("button"+parseInt(i+1)).style.visibility = "hidden";
    }
  }

  var n = skew_dataset.findIndex(function(x){return (x.tm_ef == tm_ef)});
  if (n != -1) tmbarSelect(n);
  else tmbarSelect(0);

  document.getElementById("loading").style.display = "none";
}

// 모델 비교
function mdl_comp(opt) {
  switch (opt) {
    case 1:
      document.getElementById('skew1').checked = true;
      document.getElementById('skew2').checked = true;
      document.getElementById('skew3').checked = false;
      document.getElementById('skew4').checked = false;
      document.getElementById('model1').value = "GKIM";
      document.getElementById('model2').value = "UM";
      break;
    case 2:
      document.getElementById('skew1').checked = true;
      document.getElementById('skew2').checked = true;
      document.getElementById('skew3').checked = false;
      document.getElementById('skew4').checked = false;
      document.getElementById('model1').value = "GKIM";
      document.getElementById('model2').value = "ECMWF";
      break;
    case 3:
      document.getElementById('skew1').checked = true;
      document.getElementById('skew2').checked = true;
      document.getElementById('skew3').checked = false;
      document.getElementById('skew4').checked = false;
      document.getElementById('model1').value = "UM";
      document.getElementById('model2').value = "ECMWF";
      break;
    case 4:
      document.getElementById('skew1').checked = true;
      document.getElementById('skew2').checked = true;
      document.getElementById('skew3').checked = true;
      document.getElementById('skew4').checked = false;
      document.getElementById('model1').value = "GKIM";
      document.getElementById('model2').value = "UM";
      document.getElementById('model3').value = "ECMWF";
      break;
  } // end switch

  fnGetData();
}

// 단열선도 값 변경
function fnSkewEdit() {
  var n = skew_dataset.findIndex(function(x){return (x.tm_ef == tm_ef)});
  var tmpData = JSON.parse(JSON.stringify(skew_dataset[n].data));

  var data = document.getElementsByName("tmpData");
  for (var i=0; i<data.length; i++) {
    var pres = data[i].getAttribute('data-pres');
    var k = tmpData[table_button-1].findIndex(function(x){return (x.pres == pres)});
    if (data[i].getAttribute('data-type') == "ta") {
      tmpData[table_button-1][k].ta = parseFloat(data[i].value).toFixed(1);
    }
    else if (data[i].getAttribute('data-type') == "td") {
      tmpData[table_button-1][k].td = parseFloat(data[i].value).toFixed(1);
    }

    if (parseFloat(tmpData[table_button-1][k].td) > parseFloat(tmpData[table_button-1][k].ta)) {
      tmpData[table_button-1][k].td = tmpData[table_button-1][k].ta;
    }
  }

  tmpData[table_button-1].base = skew_dataset[n].data[table_button-1].base;
  var base = parseFloat(document.getElementsByName("tmpBase")[0].value);
  if (base < 300) {
    base = 300;
  }
  else if (base > tmpData[table_button-1].base) {
    base = tmpData[table_button-1].base;
  }
  tmpData[table_button-1].tmpBase = base;

  console.log(tmpData[table_button-1]);

  skewt.plot(tmpData);
  tableDisp(tmpData[table_button-1]);
}

// 단열선도 테이블 선택(mode - 1: 첫 실행)
function tableSelect(opt, mode) {
  table_button = opt;
  for (var i=0; i<nskew_max; i++) {
    if ((i+1) == table_button) document.getElementById('button'+parseInt(i+1)).style.backgroundColor = "lightgreen";
    else document.getElementById('button'+parseInt(i+1)).style.backgroundColor = "white";
  }

  if (mode != 1) tmbarPlay(0);
}

// 단열선도 테이블 표출
function tableDisp(data) {
  var item = document.getElementById("skew_table");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  var table = document.createElement("table");
  document.getElementById("skew_table").appendChild(table);
  table.classList.add("pop");
  table.classList.add("fixed_table");

  var thead = document.createElement("thead");
  var tbody = document.createElement("tbody");

  var d_li = "<th style='width:62px;'>기압(hPa)</th><th>기온(C)</th><th>이슬점(C)</th><th>풍향(deg)</th><th>풍속(m/s)</th>";
  var d_element = document.createElement("tr");
  d_element.innerHTML = d_li;
  thead.appendChild(d_element);
  table.appendChild(thead);

  var j = table_button - 1;
  if (data == undefined) return;

  var length = 0;
  for (var k=data.length-1; k>=0; k--) {
    if (data[k].pres == "SFC" || parseFloat(data[k].ta) == -999 || parseFloat(data[k].td) == -999 || parseInt(data[k].pres) < 100) continue;

    if (k != -1) {
      var d_li = "<td style='width:62px;'>" + parseInt(data[k].pres) + "</td>";

      if (document.getElementById("skew_change").classList.contains("selected")) {
        if (data[k].ta > -999) d_li += "<td style='width:72px;'><input class='edit prevent-keydown' type='text' name='tmpData' value='" + parseFloat(data[k].ta).toFixed(1) + "' data-pres='" + data[k].pres + "' data-type='ta' oninput='fn_onlyNumInput(event);' onkeydown='if (event.keyCode == 13) fnSkewEdit();'></td>";
        else d_li += "<td style='width:72px;'>-</td>";
      }
      else {
        if (data[k].ta > -999) d_li += "<td style='width:72px;'>" + parseFloat(data[k].ta).toFixed(1) + "</td>";
        else d_li += "<td style='width:72px;'>-</td>";
      }

      if (document.getElementById("skew_change").classList.contains("selected")) {
        if (data[k].td > -999) d_li += "<td style='width:72px;'><input class='edit prevent-keydown' type='text' name='tmpData' value='" + parseFloat(data[k].td).toFixed(1) + "' data-pres='" + data[k].pres + "' data-type='td' oninput='fn_onlyNumInput(event);' onkeydown='if (event.keyCode == 13) fnSkewEdit();'></td>";
        else d_li += "<td style='width:72px;'>-</td>";
      }
      else {
        if (data[k].td > -999) d_li += "<td style='width:72px;'>" + parseFloat(data[k].td).toFixed(1) + "</td>";
        else d_li += "<td style='width:72px;'>-</td>";
      }

      if (data[k].vec > -999) d_li += "<td style='width:72px;'>" + parseFloat(data[k].vec).toFixed(1) + "</td>";
      else d_li += "<td style='width:72px;'>-</td>";

      if (data[k].wsd > -999) d_li += "<td style='width:72px;'>" + parseFloat(data[k].wsd).toFixed(1) + "</td>";
      else d_li += "<td style='width:72px;'>-</td>";
    }
    else {
      var d_li = "<td>" + parseInt(data[k].pres) + "</td><td></td><td></td><td></td><td></td>";
    }

    var d_element = document.createElement("tr");
    d_element.innerHTML = d_li;
    tbody.appendChild(d_element);
    length += 18;
  }

  var k = data.findIndex(function(x){return (x.pres == "SFC")});    
  if (k != -1) {
    var d_element = document.createElement("tr");
    d_element.style.height = "10px";
    tbody.appendChild(d_element);

    var d_li = "<th style='width:62px;'>구분</th><th>기온</th><th>이슬점</th><th>습구온도</th><th>강수/강설</th>";
    var d_element = document.createElement("tr");
    d_element.innerHTML = d_li;
    tbody.appendChild(d_element);

    if (document.getElementById("skew_change").classList.contains("selected")) {
      var d_li = "<td style='width:62px;'>지상</td><td><input class='edit prevent-keydown' type='text' name='tmpData' value='" + parseFloat(data[k].ta).toFixed(1) + "' data-pres='SFC' data-type='ta' oninput='fn_onlyNumInput(event);' onkeydown='if (event.keyCode == 13) fnSkewEdit();'></td>";
      d_li += "<td><input class='edit prevent-keydown' type='text' name='tmpData' value='" + parseFloat(data[k].td).toFixed(1) + "' data-pres='SFC' data-type='td' oninput='fn_onlyNumInput(event);' onkeydown='if (event.keyCode == 13) fnSkewEdit();'></td>";
    }
    else {
      var d_li = "<td style='width:62px;'>지상</td><td>" + parseFloat(data[k].ta).toFixed(1) + "</td>";
      d_li += "<td>" + parseFloat(data[k].td).toFixed(1) + "</td>";
    }
    d_li += "<td>" + parseFloat(data[k].tw).toFixed(1) + "</td><td>" + data[k].rn + "/" + data[k].sn + "</td>";
    var d_element = document.createElement("tr");
    d_element.innerHTML = d_li;
    tbody.appendChild(d_element);

    length += 18+18+10;
  }

  table.appendChild(tbody);
  tbody.scrollTop = length;
}

// 타임바 hover
function tmbarHover(e, bar)
{
  var xx  = e.pageX - bar.getBoundingClientRect().left;
  var tmbar = document.getElementById('tmbar');
  var length = parseFloat(tmbar.style.width)/skew_dataset.length;
  var k = parseInt(xx/length);
  var top = tmbar.getBoundingClientRect().top;
  var left = tmbar.getBoundingClientRect().left + k*length;

  var pop =  document.getElementById('tmpop1');
  pop.innerText = skew_dataset[k].tm_ef.substring(6,8) + "." + skew_dataset[k].tm_ef.substring(8,10);
  pop.style.top = parseFloat(top - 15) + "px";
  pop.style.left = parseFloat(left) + "px";
  pop.style.visibility = "visible";
}

// 동화 타임바 클릭
function tmbarClick(e, bar)
{
  var xx  = e.pageX - bar.getBoundingClientRect().left;
  var tmbar = document.getElementById('tmbar');
  var length = parseFloat(tmbar.style.width)/skew_dataset.length;
  var n = parseInt(xx/length);
  var top = tmbar.getBoundingClientRect().top;
  var left = n*length;

  var pop =  document.getElementById('tmpop2');
  pop.innerText = skew_dataset[n].tm_ef.substring(6,8) + "." + skew_dataset[n].tm_ef.substring(8,10);
  pop.style.top = parseFloat(top - 15) + "px";
  pop.style.left = parseFloat(left) + "px";
  pop.style.transform = "translateX(" + tmbar.getBoundingClientRect().left + "px)";

  var pop =  document.getElementById('tmpop3');
  pop.style.top = parseFloat(top) + "px";
  pop.style.left = parseFloat(left) + "px";
  pop.style.transform = "translateX(" + tmbar.getBoundingClientRect().left + "px)";

  tm_ef = skew_dataset[n].tm_ef;
  skewt.plot(skew_dataset[n].data);
  tableDisp(skew_dataset[n].data[table_button-1]);

  var text = "";
  var k = -1;
  for (var i=0; i<document.getElementById("select_stn").length; i++) {
    if (document.getElementById("select_stn")[i].selected == true) {
      k = i;
      break;
    }
  }

  if (k != -1) {
    text += document.getElementById("select_stn")[k].text;
  }

  var tm = tm_ef;
  var YY = tm.substring(0,4);
  var MM = tm.substring(4,6);
  var DD = tm.substring(6,8);
  var HH = tm.substring(8,10);
  var MI = tm.substring(10,12);
  var date_ef = new Date(YY, MM-1, DD, HH, MI);
  text += " VALID: " + YY + "." + MM + "." + DD + "." + HH + "KST";
  document.getElementById("data_info").innerText = text;

  return 0;
}

// 동화 타임바 클릭
function tmbarSelect(n)
{
  var ok = 0;
  for (var i=0; i<nskew_max; i++) {
    if (skew_disp[i] == undefined || skew_disp[i] == 0) continue;
    if (table_button == (i+1)) {
      ok = 1;
      break;
    }
  }

  if (ok == 0) {
    for (var i=0; i<nskew_max; i++) {
      if (skew_disp[i] == undefined || skew_disp[i] == 0) continue;
      table_button = i+1;
      break;
    }
  }

  tableSelect(table_button, 1);

  var tmbar = document.getElementById('tmbar');
  tmbar.style.visibility = "visible";
  var length = parseFloat(tmbar.style.width)/skew_dataset.length;
  var top = tmbar.getBoundingClientRect().top;
  var left = n*length;

  var pop =  document.getElementById('tmpop2');
  pop.innerText = skew_dataset[n].tm_ef.substring(6,8) + "." + skew_dataset[n].tm_ef.substring(8,10);
  pop.style.top = parseFloat(top - 15) + "px";
  pop.style.left = parseFloat(left) + "px";
  pop.style.transform = "translateX(" + tmbar.getBoundingClientRect().left + "px)";
  pop.style.visibility = "visible";

  var pop =  document.getElementById('tmpop3');
  pop.style.top = parseFloat(top) + "px";
  pop.style.left = parseFloat(left) + "px";
  pop.style.width = length + "px";
  pop.style.transform = "translateX(" + tmbar.getBoundingClientRect().left + "px)";
  pop.style.visibility = "visible";

  var text = "";
  var k = -1;
  for (var i=0; i<document.getElementById("select_stn").length; i++) {
    if (document.getElementById("select_stn")[i].selected == true) {
      k = i;
      break;
    }
  }

  if (k != -1) {
    text += document.getElementById("select_stn")[k].text;
  }

  tm_ef = skew_dataset[n].tm_ef;
  var tm = tm_ef;
  var YY = tm.substring(0,4);
  var MM = tm.substring(4,6);
  var DD = tm.substring(6,8);
  var HH = tm.substring(8,10);
  var MI = tm.substring(10,12);
  var date_ef = new Date(YY, MM-1, DD, HH, MI);
  text += " VALID: " + YY + "." + MM + "." + DD + "." + HH + "KST";

  document.getElementById("data_info").innerText = text;
  skewt.plot(skew_dataset[n].data);
  tableDisp(skew_dataset[n].data[table_button-1]);
}

// 동화 타임바(시간 이동)
function tmbarPlay(k)
{
  var n = skew_dataset.findIndex(function(x){return (x.tm_ef == tm_ef)});
  n += k;
  if (k > 0) {
    if (n >= skew_dataset.length) n = 0;
  }
  else if (k < 0) {
    if (n < 0) n = skew_dataset.length - 1;
  }

  var tmbar = document.getElementById('tmbar');
  var length = parseFloat(tmbar.style.width)/skew_dataset.length;
  var top = tmbar.getBoundingClientRect().top;
  var left = n*length;

  var pop =  document.getElementById('tmpop2');
  pop.innerText = skew_dataset[n].tm_ef.substring(6,8) + "." + skew_dataset[n].tm_ef.substring(8,10);
  pop.style.top = parseFloat(top - 15) + "px";
  pop.style.left = parseFloat(left) + "px";
  pop.style.transform = "translateX(" + tmbar.getBoundingClientRect().left + "px)";

  var pop =  document.getElementById('tmpop3');
  pop.style.top = parseFloat(top) + "px";
  pop.style.left = parseFloat(left) + "px";
  pop.style.transform = "translateX(" + tmbar.getBoundingClientRect().left + "px)";

  var text = "";
  var idx = -1;
  for (var l=0; l<document.getElementById("select_stn").length; l++) {
    if (document.getElementById("select_stn")[l].selected == true) {
      idx = l;
      break;
    }
  }

  if (idx != -1) {
    text += document.getElementById("select_stn")[idx].text;
  }

  tm_ef = skew_dataset[parseInt(n)].tm_ef;
  var tm = tm_ef;
  var YY = tm.substring(0,4);
  var MM = tm.substring(4,6);
  var DD = tm.substring(6,8);
  var HH = tm.substring(8,10);
  var MI = tm.substring(10,12);
  var date_ef = new Date(YY, MM-1, DD, HH, MI);
  text += " VALID: " + YY + "." + MM + "." + DD + "." + HH + "KST";

  document.getElementById("data_info").innerText = text;
  skewt.plot(skew_dataset[parseInt(n)].data);
  tableDisp(skew_dataset[n].data[table_button-1]);
}

// 단열선도 부가기능
function skew_ext(node)
{
  if (node.id.indexOf("reset") == -1) {
    if (node.classList.contains("selected")) {
      node.classList.remove("selected");
    }
    else {
      node.classList.add("selected");
    }
  }

  if (node.id.indexOf("change") != -1) {
    if (node.classList.contains("selected")) {
      document.getElementById("skew_edit").style.visibility = "visible";
    }
    else {
      document.getElementById("skew_edit").style.visibility = "hidden";
    }

    if ( (navigator.appName == 'Netscape' && navigator.userAgent.search('Trident') != -1) || (navigator.userAgent.toLowerCase().indexOf("msie") != -1) ) {
      document.getElementById("skew_edit").style.paddingTop = "4px";
    }
  }

  var n = skew_dataset.findIndex(function(x){return (x.tm_ef == tm_ef)});
  skewt.plot(skew_dataset[parseInt(n)].data);
  tableDisp(skew_dataset[n].data[table_button-1]);
}

// 스크롤 시 시간바 이동
function tmbarScroll()
{
  var tmbar = document.getElementById('tmbar');

  var pop =  document.getElementById('tmpop2');
  pop.style.transform = "translateX(" + tmbar.getBoundingClientRect().left + "px)";
  var pop =  document.getElementById('tmpop3');
  pop.style.transform = "translateX(" + tmbar.getBoundingClientRect().left + "px)";
}

function fnGetData(opt) {
  if (disptype == "graph") {
    fnGraphData(-1);
    if (opt != -1) {
      domain1 = undefined;
      domain2 = undefined;
    }
  }
  else if (disptype == "skew") {
    fnSkewData(-1);
  }
}

function chart_select(node, value) {
  if (node.classList.contains("selected")) {
    node.classList.remove("selected");
    document.getElementById('select_'+node.getAttribute("data-value")).style.display = "none";

    var n = chart_list.findIndex(function(x){return (x.name == node.getAttribute("data-value") && x.level == -1)});
    chart_list[n].disp = 0;
  }
  else {
    node.classList.add("selected");
    document.getElementById('select_'+node.getAttribute("data-value")).style.display = "block";

    var n = chart_list.findIndex(function(x){return (x.name == node.getAttribute("data-value") && x.level == -1)});
    chart_list[n].disp = 1;
  }

  fnChartDisp();
}

function chart_split(id, checked) {
  for (var i=0; i<chart_list.length; i++) {
    if (chart_list[i].name == id.toString().split("_")[0] && chart_list[i].level == -1) {
      if (checked) {
        chart_list[i].split = 1;
      }
      else {
        chart_list[i].split = 0;
      }
    }
  }

  fnChartDisp();
}

function data_select(checked, value, opt) {
  var model  = value.split(":")[0];
  var name   = value.split(":")[1];
  var level  = value.split(":")[2];
  var offset = [];
  if (model == "OBS") offset[0] = 0;
  else {
    var data = document.getElementsByName(model + "_offset");
    for (var i=0; i<data.length; i++) {
      if (data[i].checked) offset[offset.length] = -1 * parseInt(data[i].value);
    }
  }

  for (var i=0; i<offset.length; i++) {
    var n = input.findIndex(function(x){return (x.model == model && x.offset == offset[i] && x.name == name && x.level == level)});
    if (checked == 0) {
      if (n == -1) {
      }
      else {
        var k = datainfo.findIndex(function(x){return (x.model == input[n].model && x.offset == offset[i] && x.name == input[n].name && x.level == input[n].level)})  
        datainfo[k].disp = 0;
        count--;
        input.splice(n,1);
      }
    }
    else if (n == -1) {
      var k = input.length;
      input[k] = {};
      input[k].model = model;
      input[k].name  = name;
      input[k].level = level;
      input[k].offset = offset[i];
    }
  }
  
  if (checked == 0) fnChartDisp();

  if (input.length > 0) {
    for (var i=0; i<input.length; i++) {
      var YY = tm_fc.substring(0,4);
      var MM = tm_fc.substring(4,6);
      var DD = tm_fc.substring(6,8);
      var HH = tm_fc.substring(8,10);
      var MI = tm_fc.substring(10,12);
      var date = new Date(YY, MM-1, DD, HH, MI);

      date.setTime(date.getTime() + input[i].offset*60*60*1000);
      var tm = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2) + addZeros(date.getMinutes(),2);

      if (i == 0) {
        tm1 = tm;
        tm2 = tm;
      }
      else {
        if (tm1 > tm) tm1 = tm;
        if (tm2 < tm) tm2 = tm;
      }
    }

    var YY = tm2.substring(0,4);
    var MM = tm2.substring(4,6);
    var DD = tm2.substring(6,8);
    var HH = tm2.substring(8,10);
    var MI = tm2.substring(10,12);
    var date = new Date(YY, MM-1, DD, HH, MI);

    date.setTime(date.getTime() + 288*60*60*1000);
    var tm = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2) + addZeros(date.getMinutes(),2);
    tm2 = tm; 
  }

  if (opt != -1) fnGraphData();
}

function data_select_all(checked, value) {
  var name = value.split(":")[0];
  var level = value.split(":")[1];

  var data = document.getElementsByName("data");
  for (var i=0; i<data.length; i++) {
    if (data[i].value.split(":")[0] != "OBS" && data[i].value.split(":")[1] == name && data[i].value.split(":")[2] == level) {
      if (data[i].checked != checked) {
        data[i].checked = checked;
        data_select(checked, data[i].value);
      }
    }
  }
}

function offset_select(checked, model, value) {
  model = model.substring(0,4);
  var offset = -1 * parseInt(value);

  var data = document.getElementsByName("data");
  for (var i=0; i<data.length; i++) {
    if (data[i].checked != true) continue;

    if (data[i].value.split(":")[0] != model) continue;
    else {
      var name = data[i].value.split(":")[1];
      var level = data[i].value.split(":")[2];

      var n = input.findIndex(function(x){return (x.model == model && x.offset == offset && x.name == name && x.level == level)});
      if (checked == 0) {
        if (n == -1) {
        }
        else {
          var k = datainfo.findIndex(function(x){return (x.model == input[n].model && x.offset == offset && x.name == input[n].name && x.level == input[n].level)})  
          if (k != -1) {
            datainfo[k].disp = 0;
            count--;
            input.splice(n,1);
          }
        }
      }
      else if (n == -1) {
        var k = input.length;
        input[k] = {};
        input[k].model = model;
        input[k].name  = name;
        input[k].level = level;
        input[k].offset = offset;
      }
    }
  }

  if (checked == 0) fnChartDisp();

  if (input.length > 0) {
    for (var i=0; i<input.length; i++) {
      var YY = tm_fc.substring(0,4);
      var MM = tm_fc.substring(4,6);
      var DD = tm_fc.substring(6,8);
      var HH = tm_fc.substring(8,10);
      var MI = tm_fc.substring(10,12);
      var date = new Date(YY, MM-1, DD, HH, MI);

      date.setTime(date.getTime() + input[i].offset*60*60*1000);
      var tm = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2) + addZeros(date.getMinutes(),2);

      if (i == 0) {
        tm1 = tm;
        tm2 = tm;
      }
      else {
        if (tm1 > tm) tm1 = tm;
        if (tm2 < tm) tm2 = tm;
      }
    }

    var YY = tm2.substring(0,4);
    var MM = tm2.substring(4,6);
    var DD = tm2.substring(6,8);
    var HH = tm2.substring(8,10);
    var MI = tm2.substring(10,12);
    var date = new Date(YY, MM-1, DD, HH, MI);

    date.setTime(date.getTime() + 288*60*60*1000);
    var tm = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2) + addZeros(date.getMinutes(),2);
    tm2 = tm; 
  }

  fnGraphData();
}

function offset_select_all(checked, value) {
  var model = value;

  var data = document.getElementsByName(model + "_offset");
  for (var i=0; i<data.length; i++) {
    if (data[i].checked != checked) {
      data[i].checked = checked;
      offset_select(checked, model, data[i].value);
    }
  }
}

function fnGraphData(opt) {
  if (opt == -1) {
    input = [];
    dataset = [];

    for (var i=0; i<datainfo.length; i++) {
      datainfo[i].disp = 0;
    }

    var data = document.getElementsByName("data");
    for (var i=0; i<data.length; i++) {
      if (data[i].checked) data_select(true, data[i].value, -1)
    }

    count = 0;
  }

  var urls = [];

  for (var i=0; i<input.length; i++) {
    if (input[i].model == "OBS") urls[i] = host + "/fgd/nwp_new/nwp_stn_lib.php?mode=3&tm1=" + tm1 + "&tm2=" + tm2 + "&var=" + input[i].name + "&model=" + input[i].model;
    else {
      var YY = tm_fc.substring(0,4);
      var MM = tm_fc.substring(4,6);
      var DD = tm_fc.substring(6,8);
      var HH = tm_fc.substring(8,10);
      var MI = tm_fc.substring(10,12);
      var date = new Date(YY, MM-1, DD, HH, MI);

      date.setTime(date.getTime() + input[i].offset*60*60*1000);
      var tm = addZeros(date.getFullYear(),4) + addZeros(date.getMonth()+1,2) + addZeros(date.getDate(),2) + addZeros(date.getHours(),2) + addZeros(date.getMinutes(),2);

      urls[i] = host + "/fgd/nwp_new/nwp_stn_lib.php?mode=2&tmfc=" + tm + "&var=" + input[i].name + "&model=" + input[i].model;
    }

    urls[i] += "&stn=" + parseInt(document.getElementById("select_stn").value);

    if (input[i].level == 0) urls[i] += "&level=SFC";
    else urls[i] += "&level=" + input[i].level;

    var n = datainfo.findIndex(function(x){return (x.model == input[i].model && x.offset == input[i].offset && x.name == input[i].name && x.level == input[i].level)});
    if (n != -1) {
      if (datainfo[n].disp == 0) {
        datainfo[n].disp = 1;
        get_api_result(urls[i], n, i);
      }
    }
  }

  function get_api_result(url, idx_info, idx_input) {
    console.log(url);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.overrideMimeType("application/x-www-form-urlencoded; charset=euc-kr");
    xhr.onreadystatechange = function () {
      if (xhr.readyState != 4 || xhr.status != 200) return;
      else {
        var line = xhr.responseText.split('\n');
        if (xhr.responseText.length <= 1 && line[0] == "") {
          return;
        }

        if (line[0][0] == "@") {
          datainfo[idx_info].disp = 0;
          //input.splice(idx_input,1);
          count++;
        }
        else {
          line.forEach(function(l) {
            if (l[0] == "#" || l.length <= 1) {
              return;
            }

            var i = dataset.findIndex(function(x){return (x.tm_ef == l.split(",")[0])})
            if (i == -1) {
              i = dataset.length;
              dataset[i] = {};
              dataset[i].tm_ef = l.split(",")[0];
              dataset[i].data = [];
            }
            if (datainfo[idx_info].name != "WND") {
              dataset[i].data[idx_info] = parseFloat(l.split(",")[1]);
            }
            else {
              dataset[i].data[idx_info] = l.split(",")[1];
            }
          });
          count++;
        }

        if (count == input.length) {
          fnChartDisp();
        }
      }
    };
    xhr.send();
  }
}

function fnChartDisp() {
  // 초기화
  for (var i=0; i<chart_list.length; i++) {
    if (chart_list[i].level >= 0) {
      chart_list[i].disp = 0;
    }
  }

  // 데이터 처리
  var idx = [];
  var nvar = nobs = ngdps = ngkim = necmw = nwind = 0;
  for (var i=0; i<datainfo.length; i++) {
    if (datainfo[i].disp == 1) {
      idx[idx.length] = i;
      nvar++;  
      if (datainfo[i].model == "OBS") nobs++;
      if (datainfo[i].name == "WND") nwind++;

      var n = chart_list.findIndex(function(x){return (x.vars.indexOf(datainfo[i].name) != -1 && x.level == datainfo[i].level)})   
      if (n != -1) {
        chart_list[n].disp = 1;
      }
    }
  }

  // 표출할 차트 확인
  for (var i=0; i<chart_list.length; i++) {
    if (chart_list[i].level < 0 && chart_list[i].disp == 0) {
      for (var j=0; j<chart_list.length; j++) {
        if (i==j) continue;

        if (chart_list[i].name == chart_list[j].name) {
          chart_list[j].disp = 0;
        }
      }
    }
  }

  for (var i=0; i<chart_list.length; i++) {
    if (document.getElementById(chart_list[i].name + "_split") != undefined) {
      if (document.getElementById(chart_list[i].name + "_split").checked == false) {
        if (chart_list[i].level >= 0) {
          chart_list[i].disp = 0;
        }
      }
    }
  }

  var color = [];
  var colorScale1 = d3.scaleSequential().domain([0, nobs]).interpolator(d3.interpolateRgb("red","orange"));
  var colorScale2 = d3.scaleSequential().domain([0, offsets.length-1]).interpolator(d3.interpolateRgb("navy","skyblue"));
  var colorScale3 = d3.scaleSequential().domain([0, offsets.length-1]).interpolator(d3.interpolateRgb("darkgreen","yellowgreen"));
  var colorScale4 = d3.scaleSequential().domain([0, offsets.length-1]).interpolator(d3.interpolateRgb("purple","hotpink"));

  for (var i=0; i<input.length; i++) {
    var n = datainfo.findIndex(function(x){return (x.model == input[i].model && x.offset == input[i].offset && x.name == input[i].name && x.level == input[i].level)})   
    if (n != -1) {
      if (datainfo[n].disp == 0) {
        input.splice(i,1);
        i--;
        count--;
      }
    }
  }

  dataset.sort(function(a,b){
    return(a.tm_ef<b.tm_ef)?-1:(a.tm_ef>b.tm_ef)?1:0;
  });
   
  for (var i=0; i<dataset.length; i++) {
    var nocount = 0;
    for (var j=0; j<idx.length; j++) {
      if (dataset[i].data[idx[j]] == undefined) {
        nocount++;
      }
    }

    if (nocount == idx.length) {
      dataset.splice(i,1);
      i--;
    }
  }

  var item = document.getElementById("timediv");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  var item = document.getElementById("chartdiv");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  var item = document.getElementById("legenddiv");
  while (item.hasChildNodes()) {
    item.removeChild(item.childNodes[0]);
  }

  if (input.length == 0) return;

  // 차트 영역 설정
  var margin = {top: 35, right: 20, bottom: 20, left: 50};
  var marginNavi = {top: 20, right: 20, bottom: 20, left: 50};
  var width = document.getElementById("chartdiv").offsetWidth - margin.left - margin.right;
  var parseTime = d3.timeParse("%Y%m%d%H%M");

  var date1 = new Date().setTime(parseTime(d3.min(dataset, function(d){return d.tm_ef;})).getTime());
  var date2 = new Date().setTime(parseTime(d3.max(dataset, function(d){return d.tm_ef;})).getTime());
  var barbsize = 15;
  var xScale = d3.scaleTime().range([barbsize+10,width-(barbsize+10)]).domain([date1,date2]);//scaleBand is used for  bar chart
  var xscaleNavi = d3.scaleTime().range([0,width]).domain([date1,date2]);
  var xAxisNavi = d3.axisBottom(xscaleNavi).ticks(d3.timeDay).tickFormat(d3.timeFormat("%m/%d"));//no need to create grid

  // 시간 네비게이션
  var context = d3.select("#timediv").append("div").append("svg")
                  .attr("width",width+margin.left+margin.right)
                  .attr("height",20+margin.top)
                  .style("z-index",200)
                  .append("g")
                  .attr("transform","translate("+marginNavi.left+","+marginNavi.top+")");
  var xAxisGroupNavi = context.append("g").call(xAxisNavi).attr("transform","translate(0,0)");

  //add brush
  //Brush must be added in a group
  var brush = d3.brushX()
                .extent([[0,-marginNavi.top],[width,0]])//(x0,y0)  (x1,y1)
                .on("brush end",brushed);//when mouse up, move the selection to the exact tick //start(mouse down), brush(mouse move), end(mouse up)
        
  context.append("g")
         .attr("class","brush")
         .call(brush)
         .call(brush.move,xscaleNavi.range());    

  var k1 = k2 = k3 = k4 = 0;
  for (var k=0; k<nvar; k++) {
    if (datainfo[idx[k]].model == "OBS") {
      color[k] = colorScale1(k1);
      k1++;
    }
    else if (datainfo[idx[k]].model == "GDPS") {
      k2 = datainfo[idx[k]].offset / (-12.);
      color[k] = colorScale2(k2);
    }
    else if (datainfo[idx[k]].model == "GKIM") {
      k3 = datainfo[idx[k]].offset / (-12.);
      color[k] = colorScale3(k3);
    }
    else if (datainfo[idx[k]].model == "ECMW") {
      k4 = datainfo[idx[k]].offset / (-12.);
      color[k] = colorScale4(k4);
    }
  }

  // 범례
  var el = document.createElement("div");
  el.innerText = "[ 범례 ]";
  el.style.fontWeight = 900;
  document.getElementById("legenddiv").appendChild(el); 

  var el = document.createElement("div");
  el.style.minHeight = "6px";
  document.getElementById("legenddiv").appendChild(el); 

  for (var i=0; i<chart_list.length; i++) {
    if (chart_list[i].disp == 0) {
      continue;
    }

    if (document.getElementById(chart_list[i].name + "_split") != undefined) {
      if (document.getElementById(chart_list[i].name + "_split").checked) {
        if (chart_list[i].level < 0) {
          continue;
        }
      }
    }

    for (var k=0; k<nvar; k++) {
      if (datainfo[idx[k]].model != "OBS") continue;

      for (var j=0; j<chart_list[i].vars.length; j++) {
        if (datainfo[idx[k]].name == chart_list[i].vars[j]) {
          if (chart_list[i].level >= 0 && datainfo[idx[k]].level != chart_list[i].level) {
            continue;
          }

          var legend = {};

          if (datainfo[idx[k]].name == "T") legend.name = "기온";
          else if (datainfo[idx[k]].name == "TD") legend.name = "노점온도";
          else if (datainfo[idx[k]].name == "WSD") legend.name = "풍향";
          else if (datainfo[idx[k]].name == "RNAC") legend.name = "강수량";
          else if (datainfo[idx[k]].name == "PSL") legend.name = "해면기압";
          else if (datainfo[idx[k]].name == "WND") legend.name = "바람";
          else if (datainfo[idx[k]].name == "GH") legend.name = "지위고도";
          else if (datainfo[idx[k]].name == "EPOT") legend.name = "상당온위";
          else if (datainfo[idx[k]].name == "TW") legend.name = "습구온도";

          if (datainfo[idx[k]].level != 0) legend.level = datainfo[idx[k]].level + "hPa";
          else legend.level = "지상";

          legend.text = datainfo[idx[k]].model + " " + legend.name + "(" + legend.level + ")";

          var el = document.createElement("div");
          el.style.display = "flex";
          var el2 = document.createElement("i");
          el2.classList.add("fas");
          el2.classList.add("fa-circle");
          el2.style.color = color[k];
          el2.style.position = "relative";
          el2.style.fontSize = "80%";
          el2.style.top = "3px";
          el.appendChild(el2);
          var el3 = document.createElement("div");
          el3.style.minWidth = "4px";
          el.appendChild(el3);
          var el4 = document.createElement("div");
          el4.innerText = legend.text;
          el4.style.fontWeight = 900;
          el.appendChild(el4);
          document.getElementById("legenddiv").appendChild(el); 
        }
      }
    }
  }

  for (var i=0; i<models.length; i++) {
    if (models[i] == "OBS") continue;
    var data = document.getElementsByName(models[i] + "_offset");
    for (var j=0; j<data.length; j++) {
      if (data[j].checked) {
        var legend = {};
        if (data[j].value == 0) {
          legend.text = models[i];
        }
        else {
          legend.text = models[i] + "(-" + data[j].value + "H)";
        }

        var el = document.createElement("div");
        el.style.display = "flex";
        var el2 = document.createElement("i");
        el2.classList.add("fas");
        el2.classList.add("fa-circle");
        if (models[i] == "GDPS") {
          el2.style.color = colorScale2(parseInt(data[j].value/12));
        }
        else if (models[i] == "GKIM") {
          el2.style.color = colorScale3(parseInt(data[j].value/12));
        }
        else if (models[i] == "ECMW") {
          el2.style.color = colorScale4(parseInt(data[j].value/12));
        }
        el2.style.position = "relative";
        el2.style.fontSize = "80%";
        el2.style.top = "3px";
        el.appendChild(el2);
        var el3 = document.createElement("div");
        el3.style.minWidth = "4px";
        el.appendChild(el3);
        var el4 = document.createElement("div");
        el4.innerText = legend.text;
         el4.style.fontWeight = 900;
        el.appendChild(el4);
        document.getElementById("legenddiv").appendChild(el); 
      }
    }
  }

  // 툴팁
  var tooltip = d3.select("#chartdiv").append("div")
  .style("position","absolute")
  .style("font-weight","bold")
  .style("padding","2px 6px 2px 6px")
  .style("background-color","#DDD")
  .style("visibility","hidden");

  var tooltipCanvas = tooltip.append("canvas");
  var tooltipCtx = tooltipCanvas.node().getContext('2d');

  var canvas = [], ctx = [], ymax = [], ymin = [], yScale = [], height = [], hoverCanvas = [], hoverCtx = [], first = -999;
  for (var i=0; i<chart_list.length; i++) {
    if (chart_list[i].disp == 0) {
      continue;
    }

    if (document.getElementById(chart_list[i].name + "_split") != undefined) {
      if (document.getElementById(chart_list[i].name + "_split").checked) {
        if (chart_list[i].level < 0) {
          continue;
        }
      }
    }

    if (first < 0) {
      first = i;
    }

    if (chart_list[i].name == "WND") {
      height[i] = nwind*30+15;
    }
    else {
      height[i] = chart_list[i].height;
    }

    //create canvas
    canvas[i] = d3.select("#chartdiv").append("div").attr("id","canvas_" + i)
                  .append("canvas")
                  .attr("width",width+margin.left+margin.right)
                  .attr("height",height[i]+margin.top+margin.bottom); 

    ctx[i] = canvas[i].node().getContext('2d');
    
    //hover area
    var newArr = [];
    dataset.forEach(function(d){
      newArr = newArr.concat(d);
    });

    var left = margin.left;
    var top = document.getElementById("canvas_"+i).getBoundingClientRect().top - document.getElementById("canvas_"+first).getBoundingClientRect().top;
    hoverCanvas[i] = d3.select("#canvas_"+i).append("canvas")
                       .attr("data-id",i)
                       .attr("class","hover")
                       .attr("width",width)
                       .attr("height",height[i]+margin.top+margin.bottom)
                       .style("position","absolute").style("z-index",100).style("left",parseFloat(left)+"px").style("top",parseFloat(top)+"px"); 

    hoverCtx[i] = hoverCanvas[i].node().getContext('2d');

    //draw Graph
    drawGraph(i, ctx[i], width, height[i], margin);

    //add zoom
    var zoom = d3.zoom()
                 .scaleExtent([1,50])// <1 means can resize smaller than  original size
                 .translateExtent([[0,0],[width,height[i]]])
                 .extent([[0,0],[width,height[i]]])//view point size
                 .on("zoom",zoomed);

    hoverCanvas[i].call(zoom);

    //add mouse event
    var bisectX = d3.bisector(function(d) {return parseTime(d.tm_ef);}).left;
    hoverCanvas[i].node().addEventListener("mousemove",function(e){
      hover(e, first, this);
    })
    hoverCanvas[i].node().addEventListener("mouseout",function(e){
      clearHover();
    })
  }

  for (var i=0; i<chart_list.length; i++) {
    if (chart_list[i].disp == 0) {
      continue;
    }

    if (document.getElementById(chart_list[i].name + "_split") != undefined) {
      if (document.getElementById(chart_list[i].name + "_split").checked) {
        if (chart_list[i].level < 0) {
          continue;
        }
      }
    }

    if (transform.k > 0 && domain1 != undefined && domain2 != undefined) {    
      zoomed(-1, i);
    }
  }


  function hover(event, first, el){  
    //console.log(event);
    var id = el.getAttribute("data-id");

    var x = xScale.invert(event.offsetX);
    var n = bisectX(newArr, x, 1);//0 is the first point
    n=n==newArr.length?newArr.length-1:n;
    if (newArr.length > 1) {
      if ((parseTime(newArr[n].tm_ef)-x)>(x-parseTime(newArr[n-1].tm_ef))) {
        n = n-1;
      }
    }

    tooltipCtx.font = "700 12px Arial";

    var tooltip_data = [], tooltip_count = [];
    var ntooltip = 0, tooltip_width = 0, tooltip_height;
    tooltip_height = 18;

    for (var i=0; i<chart_list.length; i++) {
      if (chart_list[i].disp == 0) {
        continue;
      }

      if (document.getElementById(chart_list[i].name + "_split") != undefined) {
        if (document.getElementById(chart_list[i].name + "_split").checked) {
          if (chart_list[i].level < 0) {
            continue;
          }
        }
      }

      tooltip_data[i] = [];
      tooltip_count[i] = 0;

      for (var k=0; k<nvar; k++) {
        for (var j=0; j<chart_list[i].vars.length; j++) {
          if (datainfo[idx[k]].name == chart_list[i].vars[j]) {
            if (chart_list[i].level >= 0 && datainfo[idx[k]].level != chart_list[i].level) {
              continue;
            }

            if (dataset[n].data[idx[k]] == undefined) {
              continue;
            }
            else if (datainfo[idx[k]].name == "RNAC" && dataset[n].data[idx[k]] <= 0) {
              continue;
            }

            var text = datainfo[idx[k]].model;

            if (datainfo[idx[k]].offset != 0) {
              text += "(" + datainfo[idx[k]].offset + "H)";
            }
            text += " ";

            if (datainfo[idx[k]].name == "T") {
              text += "기온";
              var unit = "℃";
            }
            else if (datainfo[idx[k]].name == "TD") {
              text += "노점온도";
              var unit = "℃";
            }
            else if (datainfo[idx[k]].name == "RNAC") {
              text += "강수량";
              var unit = "mm";
            }
            else if (datainfo[idx[k]].name == "EPOT") {
              text += "상당온위";
              var unit = "K";
            }
            else if (datainfo[idx[k]].name == "GH") {
              text += "지위고도";
              var unit = "gpm";
            }
            else if (datainfo[idx[k]].name == "PSL") {
              text += "해면기압";
              var unit = "hPa";
            }
            else if (datainfo[idx[k]].name == "WND") {
              text += "바람";
            }
            else if (datainfo[idx[k]].name == "TW") {
              text += "습구온도";
            }

            if (datainfo[idx[k]].level != 0) text += "(" + datainfo[idx[k]].level + "hPa)";
            else text += "(지상)";

            var jj = tooltip_data[i].length;
            tooltip_data[i][jj] = {};

            if (datainfo[idx[k]].name == "WND") {
              var wsd = parseFloat(dataset[n].data[idx[k]].toString().split(":")[0]);
              var vec = parseFloat(dataset[n].data[idx[k]].toString().split(":")[1]);
              text += " : " + vec.toFixed(0) + "º / " + parseFloat(wsd*1.943844492).toFixed(1) + "kt";
              tooltip_data[i][jj].text = text;
              tooltip_data[i][jj].color = color[k];
            }
            else {
              text += " : " + dataset[n].data[idx[k]].toFixed(1) + unit;
              tooltip_data[i][jj].data = dataset[n].data[idx[k]];
              tooltip_data[i][jj].text = text;
              tooltip_data[i][jj].color = color[k];
            }

            if (tooltip_width < tooltipCtx.measureText(text).width) {
              tooltip_width = tooltipCtx.measureText(text).width;
            }
            tooltip_height += 16;

            tooltip_count[i]++;
          }
        }
      }

      if (tooltip_count[i] > 0) {
        tooltip_height += 6;
      }
    }

    if (tooltip_width < 60) {
      tooltip_width = 60;
    }

    if (tooltip_height < 22) {
      tooltip_height = 22;
    }

    tooltipCanvas.attr("width",tooltip_width+18)
                 .attr("height",tooltip_height-4); 

    var yy = 4;
    tooltipCtx.textAlign = "left";
    tooltipCtx.textBaseline = "top";
    tooltipCtx.fillStyle = "black";
    tooltipCtx.font = "700 12px Arial";
    tooltipCtx.fillText("[" + newArr[n].tm_ef.substring(4,6) + ". " + newArr[n].tm_ef.substring(6,8) + ". " + newArr[n].tm_ef.substring(8,10) + ":00]", 0, yy);   
    yy += 20;

    for (var i=0; i<chart_list.length; i++) {
      if (chart_list[i].disp == 0) {
        continue;
      }

      if (document.getElementById(chart_list[i].name + "_split") != undefined) {
        if (document.getElementById(chart_list[i].name + "_split").checked) {
          if (chart_list[i].level < 0) {
            continue;
          }
        }
      }

      if (chart_list[i].name != "WND") {
        tooltip_data[i].sort(function(a,b){
          return(a.data>b.data)?-1:(a.data<b.data)?1:0;
        });
      }

      if (tooltip_count[i] > 0) {
        tooltipCtx.lineWidth = 0.5;
        tooltipCtx.setLineDash([1,2]);
        tooltipCtx.beginPath();
        tooltipCtx.moveTo(0,yy-5);
        tooltipCtx.lineTo(tooltip_width+18,yy-5);
        tooltipCtx.stroke();
        tooltipCtx.setLineDash([]);
      }

      for (var jj=0; jj<tooltip_data[i].length; jj++) {
        tooltipCtx.fillStyle = tooltip_data[i][jj].color;
        tooltipCtx.beginPath();
        tooltipCtx.arc(6,yy+4,4,0,2*Math.PI);
        tooltipCtx.fill();

        tooltipCtx.fillStyle = "black";
        tooltipCtx.fillText(tooltip_data[i][jj].text, 14, yy);   
        yy += 16;
      }

      if (tooltip_count[i] > 0) {
        yy += 6;
      }
    }

    var left = parseFloat(event.offsetX + document.getElementById("canvas_"+id).getBoundingClientRect().left - document.getElementById("canvas_"+first).getBoundingClientRect().left + margin.left + 15);
    var top = parseFloat(event.offsetY + document.getElementById("canvas_"+id).getBoundingClientRect().top - document.getElementById("canvas_"+first).getBoundingClientRect().top + 5);
    
    if (tooltip_width + left + 18 > width) {
      left -= tooltip_width + 45;
    }

    tooltip.style("left", left + "px")
           .style("top", top + "px")
           .style("visibility","visible");

    for (var k=0; k<chart_list.length; k++) {
      if (chart_list[k].disp == 0) {
        continue;
      }

      if (document.getElementById(chart_list[k].name + "_split") != undefined) {
        if (document.getElementById(chart_list[k].name + "_split").checked) {
          if (chart_list[k].level < 0) {
            continue;
          }
        }
      }

      drawHover(k, hoverCtx[k], width, height[k], margin, x, n);
    }
  }

  // 선 그래프
  function lineGenerator(n, idx, xScale, yScale, ctx) {
    return d3.line()
           .x(function(d){return xScale(parseTime(d.tm_ef))+margin.left;})
           .y(function(d){return yScale(d.data[idx[n]])+margin.top;})
           .context(ctx);
  }

  function zoomed(opt, i){  
    clearHover();

    if (opt != -1) {
      if(d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
      if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore zoom-by-brush
      xScale.domain(d3.event.transform.rescaleX(xscaleNavi).domain());
      transform = d3.event.transform;
      domain1 = new Date();
      domain2 = new Date();
      domain1.setTime(d3.event.transform.rescaleX(xscaleNavi).domain()[0]);
      domain2.setTime(d3.event.transform.rescaleX(xscaleNavi).domain()[1]); 
      calcAxis();

      for (var i=0; i<chart_list.length; i++) {
        if (chart_list[i].disp == 0) {
          continue;
        }

        if (document.getElementById(chart_list[i].name + "_split") != undefined) {
          if (document.getElementById(chart_list[i].name + "_split").checked) {
            if (chart_list[i].level < 0) {
              continue;
            }
          }
        }

        drawGraph(i, ctx[i], width, height[i], margin);
        hoverCanvas[i].call(zoom.transform, transform);
      }
    }
    else {
      drawGraph(i, ctx[i], width, height[i], margin);
      hoverCanvas[i].call(zoom.transform, transform);
    }

    if (opt != -1) {
      //brush area
      context.select(".brush").call(brush.move, [xscaleNavi(d3.event.transform.rescaleX(xscaleNavi).domain()[0]),xscaleNavi(d3.event.transform.rescaleX(xscaleNavi).domain()[1])]);
    }
    else {
      //brush area
      context.select(".brush").call(brush.move, [xscaleNavi(transform.rescaleX(xscaleNavi).domain()[0]),xscaleNavi(transform.rescaleX(xscaleNavi).domain()[1])]);
    }
  }

  function brushed(opt){
    if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    else if(d3.event.sourceEvent && d3.event.sourceEvent.type === "mousemove") {
      domain1 = xscaleNavi.invert(d3.event.selection[0]);
      domain2 = xscaleNavi.invert(d3.event.selection[1]);
      xScale.domain([domain1, domain2]);
      transform.k = (date2 - date1) / (domain2 - domain1);
      transform.x = width * (date1 - domain1) / (date2 - date1) * transform.k;

      calcAxis();
      for (var i=0; i<chart_list.length; i++) {
        if (chart_list[i].disp == 0) {
          continue;
        }

        if (document.getElementById(chart_list[i].name + "_split") != undefined) {
          if (document.getElementById(chart_list[i].name + "_split").checked) {
            if (chart_list[i].level < 0) {
              continue;
            }
          }
        }

        drawGraph(i, ctx[i], width, height[i], margin);
      }
    }
    else {
      if (domain1 != undefined && domain2 != undefined) {
        xScale.domain([domain1, domain2]);
        transform.k = (date2 - date1) / (domain2 - domain1);
        transform.x = width * (date1 - domain1) / (date2 - date1) * transform.k;
      }
    }
  }
  
  function calcAxis() {
    var date1 = new Date();
    var date2 = new Date();
    date1.setTime(domain1.getTime() - parseInt(6*60*60*1000));
    date2.setTime(domain2.getTime() + parseInt(6*60*60*1000));
    line_tm1 = addZeros(date1.getFullYear(),4) + addZeros(date1.getMonth()+1,2) + addZeros(date1.getDate(),2) + addZeros(date1.getHours(),2) + addZeros(date1.getMinutes(),2);
    line_tm2 = addZeros(date2.getFullYear(),4) + addZeros(date2.getMonth()+1,2) + addZeros(date2.getDate(),2) + addZeros(date2.getHours(),2) + addZeros(date2.getMinutes(),2);

    //bullet_tm1 = addZeros(domain1.getFullYear(),4) + addZeros(domain1.getMonth()+1,2) + addZeros(domain1.getDate(),2) + addZeros(domain1.getHours(),2) + addZeros(domain1.getMinutes(),2);
    //bullet_tm2 = addZeros(domain2.getFullYear(),4) + addZeros(domain2.getMonth()+1,2) + addZeros(domain2.getDate(),2) + addZeros(domain2.getHours(),2) + addZeros(domain2.getMinutes(),2);
    bullet_tm1 = line_tm1;
    bullet_tm2 = line_tm2;
  }

  function drawGraph(i, ctx, width, height, margin) {
    if (chart_list[i].name == "WND") {
      drawWind(i, ctx, width, height, margin);
      return;
    }

    var date = new Date();
    date.setTime(parseTime(dataset[0].tm_ef).getTime()+60*60*1000);
    var scale = xScale(date) - xScale(parseTime(dataset[0].tm_ef));
    ctx.clearRect(0, 0, width+margin.left+margin.right, height+margin.top+margin.bottom);

    //calculate min/max, yscale
    if (chart_list[i].name == "RNSN") {
      ymax[i] = 0; ymin[i] = 0;
    }
    else {
      ymax[i] = -999999; ymin[i] = 999999;
    }

    for (k=0; k<nvar; k++) {
      for (var j=0; j<chart_list[i].vars.length; j++) {
        if (datainfo[idx[k]].name == chart_list[i].vars[j]) {
          if (chart_list[i].level >= 0 && datainfo[idx[k]].level != chart_list[i].level) {
            continue;
          }

          for (var n=0; n<dataset.length; n++) {
            if (document.getElementById("dynamic-y").checked) {
              if (domain1 == undefined || domain2 == undefined) {
              }
              else if (dataset[n].tm_ef < line_tm1 || dataset[n].tm_ef > line_tm2) {
                continue;
              }
            }

            if (dataset[n].data[idx[k]] > ymax[i]) ymax[i] = dataset[n].data[idx[k]];
            if (dataset[n].data[idx[k]] < ymin[i]) ymin[i] = dataset[n].data[idx[k]];
          }
        }
      }
    }

    if (chart_list[i].name == "RNSN") {
      ymax[i] += ymax[i]/10;
      if (ymax[i] < 2.5) ymax[i] = 2.5;
    }
    else {
      ymax[i] += (ymax[i]-ymin[i])/10;
      ymin[i] -= (ymax[i]-ymin[i])/10;

      if (chart_list[i].name == "TMP") {
        if (ymax[i] - ymin[i] < 10) {
          ymax[i] += (10 - (ymax[i] - ymin[i]))/2.
          ymin[i] -= (10 - (ymax[i] - ymin[i]))/2.
        }
      }
    }
    yScale[i] = d3.scaleLinear().range([0,height]).domain([ymax[i], ymin[i]]);  

    //add unit
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "700 12px Arial";
    if (chart_list[i].level > 0) {
      ctx.fillText("" + chart_list[i].level + "hPa " + chart_list[i].text + " (" + chart_list[i].unit + ")", margin.left, 10);
    }
    else if (chart_list[i].level == 0) {
      ctx.fillText("지상 " + chart_list[i].text + " (" + chart_list[i].unit + ")", margin.left, 10);
    }
    else {
      ctx.fillText(chart_list[i].text + " (" + chart_list[i].unit + ")", margin.left, 10);
    }
    ctx.font = "12px Arial";

    //draw line
    for (k=0; k<nvar; k++) {
      for (var j=0; j<chart_list[i].vars.length; j++) {
        if (chart_list[i].name == "RNSN") {
        //  continue;
        }
        else if (datainfo[idx[k]].model == "OBS") {
          continue;
        }

        if (datainfo[idx[k]].name == chart_list[i].vars[j]) {
          if (chart_list[i].level >= 0 && datainfo[idx[k]].level != chart_list[i].level) {
            continue;
          }

          ctx.strokeStyle = color[k];
          if (datainfo[idx[k]].name == "RNAC") {
            ctx.lineWidth = 1;
          }
          else ctx.lineWidth = 1;
          if (datainfo[idx[k]].name == "TD" || datainfo[idx[k]].name == "RNAC") ctx.setLineDash([2,2]);
          else ctx.setLineDash([]);

          ctx.beginPath();
          if (datainfo[idx[k]].name == "RNAC") {
            var move = 0, premove = 0;;
            for (var n=0; n<dataset.length; n++) {
              if (domain1 == undefined || domain2 == undefined) {
              }
              else if (dataset[n].tm_ef < line_tm1 || dataset[n].tm_ef > line_tm2) {
                continue;
              }

              if (dataset[n].data[idx[k]] == undefined) {
                continue;
              }

              if (dataset[n].data[idx[k]] <= 0) {
                move = 0;
              }

              if (move == 0 && premove == 0) {
                ctx.moveTo(xScale(parseTime(dataset[n].tm_ef))+margin.left, yScale[i](dataset[n].data[idx[k]])+margin.top);
                ctx.closePath();
              }
              else if (move == 1) {
                ctx.lineTo(xScale(parseTime(dataset[n].tm_ef))+margin.left, yScale[i](dataset[n].data[idx[k]])+margin.top);
              }
              else {
                ctx.lineTo(xScale(parseTime(dataset[n].tm_ef))+margin.left, yScale[i](dataset[n].data[idx[k]])+margin.top);
              }

              premove = move;
              move++;
            }
          }
          else {
            lineGenerator(k, idx, xScale, yScale[i], ctx)(dataset.filter(function(d) {return d.data[idx[k]] != undefined}));
          }
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);

    //draw bullet
    ctx.globalAlpha = 1;
    for (k=0; k<nvar; k++) {
      for (var j=0; j<chart_list[i].vars.length; j++) {
        if (chart_list[i].name == "RNSN" && datainfo[idx[k]].model != "OBS") {
          //continue;
        }

        if (datainfo[idx[k]].name == chart_list[i].vars[j]) {
          if (chart_list[i].level >= 0 && datainfo[idx[k]].level != chart_list[i].level) {
            continue;
          }

          if (datainfo[idx[k]].model == "OBS") {
            var radius = 2.5;
          }
          else var radius = 2.5;

          ctx.strokeStyle = color[k];
          ctx.fillStyle = color[k];
          ctx.lineWidth = 1;

          for (var n=0; n<dataset.length; n++) {
            if (domain1 == undefined || domain2 == undefined) {
            }
            else if (dataset[n].tm_ef < bullet_tm1 || dataset[n].tm_ef > bullet_tm2) {
              continue;
            }

            if (dataset[n].data[idx[k]] == undefined) {
              continue;
            }
            else if (datainfo[idx[k]].name == "RNAC" && dataset[n].data[idx[k]] <= 0) {
              continue;
            }
            else if (datainfo[idx[k]].name == "TD" && datainfo[idx[k]].model != "OBS") {
              continue;
            }

            ctx.beginPath();
            ctx.arc(xScale(parseTime(dataset[n].tm_ef))+margin.left,yScale[i](dataset[n].data[idx[k]])+margin.top,radius,0,2*Math.PI);
            if (datainfo[idx[k]].name == "TD" && datainfo[idx[k]].model == "OBS") {
              ctx.stroke();
            }
            //else if (datainfo[idx[k]].name == "RNAC" && datainfo[idx[k]].model != "OBS") {
            //  ctx.stroke();
            //}
            else ctx.fill();
          }
        }
      }
    }

    //clear margin area
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, margin.left, height+margin.top+margin.bottom);
    ctx.clearRect(width+margin.left, 0, width+margin.left+margin.right, height+margin.top+margin.bottom);
    ctx.setLineDash([]);

    //add y axis
    var yAxis = d3.axisLeft(yScale).tickSize(-width);
    if (chart_list[i].name == "RNSN") {
      var ticks = yScale[i].ticks(5);
    }
    else {
      var ticks = yScale[i].ticks();
    }
    var tickSize = -width;
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    ticks.forEach(function(d) {
      ctx.moveTo(margin.left, yScale[i](d)+margin.top);
      ctx.lineTo(width+margin.left, yScale[i](d)+margin.top);
    });
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ticks.forEach(function(d) {
      ctx.fillText(d, 45, yScale[i](d)+margin.top);
    });
 
    //add x axis
    if (scale*8 < 100) {
      var ticks = xScale.ticks(d3.timeDay);
    }
    else if (scale*4 < 100) {
      var ticks = xScale.ticks(d3.timeHour.every(12));
    }
    else if (scale*2 < 100) {
      var ticks = xScale.ticks(d3.timeHour.every(6));
    }
    else if (scale*0.85 < 100) {
      var ticks = xScale.ticks(d3.timeHour.every(3));
    }
    else {
      var ticks = xScale.ticks(d3.timeHour);
    }

    var tickSize = -width;
    var tickFormat;
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    ticks.forEach(function(d) {
      ctx.moveTo(xScale(d)+margin.left, height+margin.top);
      ctx.lineTo(xScale(d)+margin.left, margin.top);
    });
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ticks.forEach(function(d) {
      if (scale*8 < 100) {
        tickFormat = d3.timeFormat("%m/%d");
      }
      else {
        if (d3.timeFormat("%H")(d) == "00") {
          tickFormat = d3.timeFormat("%m/%d");
          ctx.font = "700 12px Arial";
        }
        else {
          tickFormat = d3.timeFormat("%H:%M");
          ctx.font = "12px Arial";
        }
      }

      ctx.fillText(tickFormat(d), xScale(d)+margin.left, height+margin.top+margin.bottom);
    });
  }

  function drawWind(i, ctx, width, height, margin) {
    var itv = (xScale.domain()[1] - xScale.domain()[0])/(24*60*60*1000);
    var date = new Date();
    date.setTime(parseTime(dataset[0].tm_ef).getTime()+60*60*1000);
    var scale = xScale(date) - xScale(parseTime(dataset[0].tm_ef));
    ctx.clearRect(0, 0, width+margin.left+margin.right, height+margin.top+margin.bottom);

    //add unit
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "700 12px Arial";
    ctx.fillText(chart_list[i].text + " (" + chart_list[i].unit + ")", margin.left, 10);
    ctx.font = "12px Arial";

    //draw windbarb
    var barbsize = 15;
    var nwind = 0;
    for (k=0; k<nvar; k++) {
      for (var j=0; j<chart_list[i].vars.length; j++) {
        if (datainfo[idx[k]].name == chart_list[i].vars[j]) {
          ctx.strokeStyle = color[k];
          ctx.fillStyle = color[k];
          ctx.lineWidth = 1;

          for (var n=0; n<dataset.length; n++) {
            if (domain1 == undefined || domain2 == undefined) {
            }
            else if (dataset[n].tm_ef < bullet_tm1 || dataset[n].tm_ef > bullet_tm2) {
              continue;
            }

            if (dataset[n].data[idx[k]] == undefined) {
              continue;
            }

            if (scale*4 < barbsize) {
              if (parseInt(d3.timeFormat("%H")(parseTime(dataset[n].tm_ef))) % 12 != 9) {
                continue;
              }
            }
            else if (scale*2 < barbsize) {
              if (parseInt(d3.timeFormat("%H")(parseTime(dataset[n].tm_ef))) % 6 != 3) {
                continue;
              }
            }
            else if (scale*0.667 < barbsize) {
              if (parseInt(d3.timeFormat("%H")(parseTime(dataset[n].tm_ef))) % 3 != 0) {
                continue;
              }
            }

            var wsd = parseFloat(dataset[n].data[idx[k]].toString().split(":")[0]);
            var vec = parseFloat(dataset[n].data[idx[k]].toString().split(":")[1]);
            drawWindBarb(wsd, vec, barbsize, xScale(parseTime(dataset[n].tm_ef))+margin.left, nwind*30+15+margin.top, ctx);
          }

          nwind++;
        }
      }
    }

    //clear margin area
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, margin.left, height+margin.top+margin.bottom);
    ctx.clearRect(width+margin.left, 0, width+margin.left+margin.right, height+margin.top+margin.bottom);

    //add level axis
    ctx.strokeStyle = "black";          
    ctx.lineWidth = 0.2;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = "12px Arial";
    ctx.setLineDash([4,2]);

    var pre_level = -999;
    nwind = 0;
    for (k=0; k<nvar; k++) {
      for (var j=0; j<chart_list[i].vars.length; j++) {
        if (datainfo[idx[k]].name == chart_list[i].vars[j]) {
          if (pre_level != datainfo[idx[k]].level) {
            if (datainfo[idx[k]].level == 0) {
              ctx.fillText("지상", 45, nwind*30+5+margin.top);
            }
            else {
              ctx.fillText(datainfo[idx[k]].level + "hPa", 45, nwind*30+5+margin.top);
            }
            ctx.beginPath();
            ctx.moveTo(margin.left, nwind*30+margin.top);
            ctx.lineTo(width+margin.left, nwind*30+margin.top);
            ctx.stroke();
            pre_level = datainfo[idx[k]].level;
          }
          nwind++;
        }
      }
    }
    ctx.setLineDash([]);

    //add x axis
    if (scale*8 < 100) {
      var ticks = xScale.ticks(d3.timeDay);
    }
    else if (scale*4 < 100) {
      var ticks = xScale.ticks(d3.timeHour.every(12));
    }
    else if (scale*2 < 100) {
      var ticks = xScale.ticks(d3.timeHour.every(6));
    }
    else if (scale*0.85 < 100) {
      var ticks = xScale.ticks(d3.timeHour.every(3));
    }
    else {
      var ticks = xScale.ticks(d3.timeHour);
    }

    var tickSize = -width;
    var tickFormat;
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    ticks.forEach(function(d) {
      ctx.moveTo(xScale(d)+margin.left, height+margin.top);
      ctx.lineTo(xScale(d)+margin.left, margin.top);
    });
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ticks.forEach(function(d) {
      if (scale*8 < 100) {
        tickFormat = d3.timeFormat("%m/%d");
      }
      else {
        if (d3.timeFormat("%H")(d) == "00") {
          tickFormat = d3.timeFormat("%m/%d");
          ctx.font = "700 12px Arial";
        }
        else {
          tickFormat = d3.timeFormat("%H:%M");
          ctx.font = "12px Arial";
        }
      }

      ctx.fillText(tickFormat(d), xScale(d)+margin.left, height+margin.top+margin.bottom);
    });
  }

  function drawHover(i, ctx, width, height, margin, x, n) {
    ctx.clearRect(0, 0, width, height+margin.top+margin.bottom);

    ctx.strokeStyle = "skyblue";
    ctx.setLineDash([4,2]);
    ctx.lineWidth = 1.5;
    var xx = xScale(parseTime(newArr[n].tm_ef));
    ctx.beginPath();
    ctx.moveTo(xx, margin.top);
    ctx.lineTo(xx, height+margin.top);    
    ctx.stroke();

    ctx.setLineDash([]);

    var radius = 4;
    var barbsize = 15;
    var nwind = 0;

    for (var k=0; k<nvar; k++) {
      for (var j=0; j<chart_list[i].vars.length; j++) {
        if (datainfo[idx[k]].name == chart_list[i].vars[j]) {
          if (chart_list[i].level >= 0 && datainfo[idx[k]].level != chart_list[i].level) {
            continue;
          }

          ctx.strokeStyle = color[k];
          ctx.fillStyle = color[k];

          if (datainfo[idx[k]].name == "WND") {
            nwind++;
          }

          if (dataset[n].data[idx[k]] == undefined) {
            continue;
          }
          else if (datainfo[idx[k]].name == "RNAC" && dataset[n].data[idx[k]] <= 0) {
            continue;
          }

          if (datainfo[idx[k]].name == "WND") {
            var wsd = parseFloat(dataset[n].data[idx[k]].toString().split(":")[0]);
            var vec = parseFloat(dataset[n].data[idx[k]].toString().split(":")[1]);
            //ctx.lineWidth = 2;
            drawWindBarb(wsd, vec, barbsize, xScale(parseTime(dataset[n].tm_ef)), (nwind-1)*30+15+margin.top, ctx);
          }
          else {
            ctx.beginPath();
            ctx.arc(xScale(parseTime(dataset[n].tm_ef)),yScale[i](dataset[n].data[idx[k]])+margin.top,radius,0,2*Math.PI);
            ctx.fill();
          }
        }
      }
    }
  }

  function clearHover() {
    tooltip.style("visibility","hidden");

    for (var i=0; i<chart_list.length; i++) {
      if (chart_list[i].disp == 0) {
        continue;
      }

      if (document.getElementById(chart_list[i].name + "_split") != undefined) {
        if (document.getElementById(chart_list[i].name + "_split").checked) {
          if (chart_list[i].level < 0) {
            continue;
          }
        }
      }

      hoverCtx[i].clearRect(0, 0, width+margin.left+margin.right, height[i]+margin.top+margin.bottom);
    }
  }

  function drawWindBarb(wsd, vec, barbsize, x, y, ctx) {
    if (wsd <= 0 || vec == 0) {
      ctx.beginPath();
      ctx.arc(x,y,2,0,2*Math.PI);
      ctx.stroke();
      return;
    }

    wsd *= 1.943844492;
    var flags = Math.floor(wsd/50);
    var pennants = Math.floor((wsd - flags*50)/10);
    var halfpennants = Math.floor((wsd - flags*50 - pennants*10)/5);
    var px = barbsize;
    // Draw wind barb stems
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(parseFloat(vec - 180) * DEGRAD);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, barbsize);
    ctx.stroke();
    // Draw wind barb flags and pennants for each stem
    for (var i=0; i<flags; i++) {
      ctx.beginPath();
      ctx.moveTo(0, px);
      ctx.lineTo(-10, px);
      ctx.lineTo(0, px-4);
      ctx.stroke();
      ctx.fill();
      px -= 7;
    }
    // Draw pennants on each barb
    for (i=0; i<pennants; i++) {
      ctx.beginPath();
      ctx.moveTo(0, px);
      ctx.lineTo(-10, px+4);
      ctx.stroke();
      px -= 3;
    }
    // Draw half-pennants on each barb
    if (flags == 0 && pennants == 0 && halfpennants == 0) {
      halfpennants = 1;
    }

    for (i=0; i<halfpennants; i++) {
      ctx.beginPath();
      ctx.moveTo(0, px);
      ctx.lineTo(-5, px+2);
      ctx.stroke();
      px -= 3;
    }
    ctx.restore();
  }

}

// 창 크기 변경에 따른 그래프 크기 조정
function fnBodyResize() {
  if (disptype == "graph") {
    document.getElementById('chartdiv').style.width = (window.innerWidth - document.getElementById('left_menu').offsetWidth - 178) + "px";
    document.getElementById('chartdiv').style.height = (window.innerHeight - document.getElementById('head').offsetHeight - document.getElementById('menu').offsetHeight - 68) + "px";
    document.getElementById('legenddiv').style.height = (window.innerHeight - document.getElementById('head').offsetHeight - document.getElementById('menu').offsetHeight - 15) + "px";
    document.getElementById('drag_menu').style.height = (window.innerHeight - document.getElementById('head').offsetHeight - document.getElementById('menu').offsetHeight - 240) + "px";
    fnChartDisp();  
  }
  else if (disptype == "skew") {
    //document.getElementById('skew_container').style.height = (window.innerHeight - document.getElementById('head').offsetHeight - document.getElementById('menu').offsetHeight - 12) + "px";
  }
}

// 키보드를 통한 동화 조작(opt- 0: keydown, 1: keyup)
function doKey(event, opt)
{
  if (event.srcElement.attributes.class != undefined) {
    if (event.srcElement.attributes.class.value.indexOf("TimeBox") != -1) return -1;
    if (event.srcElement.attributes.class.value.indexOf("prevent-keydown") != -1) return -1;
  }

  if (disptype == "skew") {
    if (opt == 0) {
      if(event.keyCode == 37) {        // 왼 화살표
        tmbarPlay(-1);
      }
      else if(event.keyCode == 39) {   // 오른 화살표
        tmbarPlay(1);
      }
      else if(event.keyCode == 38) {   // 위 화살표
        tmbarPlay(3);
      }
      else if(event.keyCode == 40) {   // 아래 화살표
        tmbarPlay(-3);
      }
      else if(event.keyCode == 27) {   // ESC
        document.getElementById("notice").style.display = "none";
      }
      else if(event.keyCode == 116) {   // F5
        location.reload();
      }
    }
  }
  else if (disptype == "graph") {
    if (opt == 0) {
      if(event.keyCode == 116) {   // F5
        location.reload();
      }
      else if(event.keyCode == 89) {   // Y
        if (document.getElementById("dynamic-y").checked) {
          document.getElementById("dynamic-y").checked = false;
        }
        else {
          document.getElementById("dynamic-y").checked = true;
        }
        fnChartDisp();
      }
    }
  }

  return 0;
}

// 구버전 이동
function old_view() {
  var url = "/wrn/wrn_ta_txt.php";
 
  window.open(url,"_blank");
}

// 참조용 대상 링크 팝업으로 호출
function view_win(page, wd) {
  url = page;
  window.open(url,"","location=yes,left=30,top=30,width=" + wd + ",height=800,scrollbars=yes,resizable=yes");
}

// inputbox에 숫자형식만 입력되도록 체크
function fn_onlyNumInput(e) {
  if (!isNaN(e.target.value) || (e.target.value[0] == "-" && e.target.value.length ==1)) {      
  }
  else {
    var value = "";
    var decimal_cnt = 0;
    for (var i=0; i<e.target.value.length; i++) {
      if ((i == 0 && e.target.value[i] == "-") || !isNaN(e.target.value[i])) {
        value += e.target.value[i];
      }      
      else if (decimal_cnt == 0 && e.target.value[i] == ".") {
        value += e.target.value[i];
        decimal_cnt++;
      }
    }
    //e.target.value = e.target.value.substring(0, e.target.value.length - 1);
    e.target.value = value;
    alert('숫자만 입력가능합니다.');
  }
}