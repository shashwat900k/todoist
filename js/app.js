$(document).ready(function(){

  $(window).on('resize',checkWidth);

  $(".index-toggle-links").on('click',toggleIndex);
  //$(".page-link").on('click',pageProperty);

  $(document).on('click','.addtask', showform);

  $(".tasks-list").on('click',".submittask",checkandsubmit);

  $(".tasks-list").on('click',".canceltask",canceltask);

  $(".tasks-list").on('click','.column1',addDeletedTaskToOtherTable);

  $(".frow").on('click',insertalltasks);

  $(".srow").on('click',function(){
    showtodaystasks(timetoday,0);
  });

  $(".trow").on('click',function(){
    showtodaystasks(time7,1);
  });
  $(".tasks-list").on('click',".column2",updatetask);

  tasksDb = window.openDatabase("tasksdatabase", "1.0", "WebSQL database", 5*1024*1024);
  instantiateDataBase();

  customizeDatePicker();
  checkWidth();
  insertalltasks();
  updateleftindextasksvalue();

});
//        Global Variables        //
let currentday = new Date();
currentday.setHours(0);
currentday.setMinutes(0);
currentday.setSeconds(0);
let ctime = currentday.getTime()/1000;
let cday = currentday.getDay();
let timetoday = ctime + 60*60*24*1;
let time7 = ctime + 60*60*24*7;
let leftindexitemclicked = -1;
let detachedFormGlobal = 0;
let weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"
  ,"Saturday"];
let globalRowId = 0,findDayValue=0;
let monthNames = ["Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
let returneddate=0,rtime=0,rday=0;

//      All DB related functions here   //
function createTableTaskList(){
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS tasks_list"+
        "(id INTEGER PRIMARY KEY AUTOINCREMENT"+
        ", taskinfo TEXT"+
        ", taskdate DATETIME)"
      )});
}

function createTableTaskDeleted(){
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS deletedtasks"+
        "(id INTEGER PRIMARY KEY"+
        ", taskinfo TEXT"+
        ", taskdate DATETIME)"
      )});
}

function instantiateDataBase()
{
  createTableTaskList();
  createTableTaskDeleted();
}

function insertRowInDb(tinfo,tdate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "INSERT INTO tasks_list(taskinfo,taskdate) VALUES(?,?)"
        ,[tinfo,tdate]
      )});
}

function updateRowInDb(rowid,tinfo,tdate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowid]
        ,function(tx,result){
          if(tinfo.length!=0){
            tasksDb.transaction(
              function(tx){
                tx.executeSql("UPDATE tasks_list SET taskinfo=?, taskdate=? WHERE id=?"
                  ,[tinfo,tdate,rowid]);
              });
          }
        });
    });
}

function addDeletedTaskToOtherTable(){
  let tasktodelete = $(this).parent();
  let taskid = parseInt(tasktodelete.attr('id'));
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[taskid]
        ,function(tx,result){
          tx.executeSql("INSERT INTO deletedtasks(id,taskinfo,taskdate) VALUES(?,?,?)"
            ,[result.rows.item(0)["id"]
              ,result.rows.item(0)["taskinfo"]
              ,result.rows.item(0)["taskdate"]]
          );
        });
    });
  $(tasktodelete).remove();
  deletetherow(taskid);
  updateleftindextasksvalue();
  canceltask();
}

function deletetherow(taskid){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("DELETE FROM tasks_list WHERE id = ?",
        [taskid])});
}

//   //////////////////////////////////////////////////////////////////////

function customizeDatePicker(){
  $(".taskdate").datepicker({
    autoclose: true,
    clearBtn: true,
    format: 'd M yyyy',
    todayHighlight: true,
    startDate: new Date()
  });
}

function checkWidth(){

  let width = $(window).width();
  if(width<753){
    $(".index-toggle").show();
    $(".left-index").hide();
  }
  else if(width>=753){
    $(".index-toggle").hide();
    $(".left-index").show();
    if($(".fa-times").length>0){
      $(".index-toggle-links").removeClass("fa-times").addClass("fa-bars");
    }
  }
  if(width<820)
    $(".left-index ul").css("padding-left","25%");
  else
    $(".left-index ul").css("padding-left","40%");
}

function toggleIndex(){

  if($(".left-index").css('display') === 'none'){
    $(".left-index").toggle();
    $(".left-index").removeClass("hidden-xs col-sm-4").addClass("left-index-toggle");
    $(".main-body").removeClass("col-xs-12").addClass("small-main-body");
    $(".index-toggle-links").addClass("fa-times").removeClass("fa-bars");
    $(".index-toggle-links").css({"color": "#fff","background-color":"#DB4C3F"});
  }
  else{
    $(".left-index").toggle();
    $(".left-index").removeClass("left-index-toggle").addClass("hidden-xs col-sm-4");
    $(".main-body").removeClass("small-main-body").addClass("col-xs-12");
    $(".index-toggle-links").removeClass("fa-times").addClass("fa-bars");
    $(".index-toggle-links").css({"background-color": "#DB4C3F","color":"#fff"});
  }
}

function showFormNext7Days(_this,detachedForm){
  canceltask();
  $(_this).addClass("showParticularForm");
  $(detachedForm).insertAfter(".showParticularForm");
  if($(".addtaskform").css("display")=="none"){
    $(".addtaskform").css("display","block");
  }
  else
    checkandsubmit();
}

function showform(){
  $(".addtask").removeClass("showParticularForm");
  $(".addtaskformcloned").remove();
  if($(".addtaskform").css("display")!="none")
    $(".addtaskform").css("display","none");
  let detachedForm = null;

  if($(".addtask").length>5){
    let _this = $(this);
    detachedFormGlobal = $(".addtaskform").detach();
    showFormNext7Days(_this,detachedFormGlobal);
  }
  else{
    if(detachedFormGlobal != 0){
      detachedForm = detachedFormGlobal;
      $(detachedForm).insertBefore('.addtask');
    }
    canceltask();
    if($(".addtaskform").css("display")=="none")
      $(".addtaskform").css("display","block");
    else {
      checkandsubmit();
    }
  }
}

function decideWhichViewToUpdateAndShow(){
  if(leftindexitemclicked==1)
    insertalltasks();
  else if(leftindexitemclicked==2)
    showtodaystasks(timetoday,0);
  else if(leftindexitemclicked==3)
    showtodaystasks(time7,1);
}

function checkandsubmit(){
  if($(".submittask").text()!="Save"){
    console.log("should not be printed");
    if($(".taskinfo").val().length>0){
      let tinfo = $(".taskinfo").val();
      let tdate = $(".taskdate").val();
      insertRowInDb(tinfo,tdate);
      location.reload();
    }
  }
  else{
    let rowid = parseInt(globalRowId);
    let tinfo = $(".taskinfo").val();
    let tdate = $(".taskdate").val();
    updateRowInDb(rowid,tinfo,tdate);
    updateleftindextasksvalue();
    $(".submittask").text("Add Task");
    location.reload();
  }
  decideWhichViewToUpdateAndShow();
  canceltask();
}

function checkIfAlreadyInserted(taskId){
  let searchTaskId = "#"+taskId;
  let value = $(searchTaskId).length==0?0:1;
  return value;
}

function canceltask(){
  $(".addtaskform").css("display","none");
  $(".taskinfo").val('');
  $(".taskdate").val('');
  if($(".submittask").text()=="Save")
    $(".submittask").text("Add Task");
}

function removePropertiesOfOtherView(){
  while($(".addtask").length>1)
    $(".addtask").not(":last").remove();
  if($(".weekdayNames").length!=0)
    $(".weekdayNames").remove();
  for(let i=7;i>=1;i--){
    let dayValue = ".day"+i;
    if($(dayValue).length!=0)
      $(dayValue).remove();
  }
  canceltask();
  $(".maintitle").remove();
  $(".allthetasks").remove();
  $(".overduetoday").remove();
  $(".today").remove();
  if(leftindexitemclicked==1){
  }
}

function selectDateDisplay(rowdate,c3){
  manipulateReturnedDate(rowdate);
  if(rtime-ctime<=1*60*60*24 && rtime>ctime)
    $(c3).text("Today");
  else if(rtime-ctime<=7*60*60*24 && rtime>=ctime){
    if(rday-cday==1 || rday+7-cday==1){
      $(c3).text("Tomorrow");
      $(c3).css({"text-decoration":"underline","text-decoration-color":"#166CEC"});
    }
    else{
      $(c3).text(weekdays[returneddate.getDay()]);
      $(c3).css({"text-decoration":"underline","text-decoration-color":"#FFB504"});
    }
  }
}

function setTableRows(trid,tinfo,tdate){
  for(let j=1;j<=3;j++)
    $(trid).append("<td class=column"+j+"></td>");
  let c1 =trid+">.column1";
  let c2 = trid+">.column2";
  let c3 = trid+">.column3";
  $(c1).append("<button></button>");
  $(c2).append(tinfo);
  $(c3).append(tdate);
  if(leftindexitemclicked!=3){
    $(c2).css("border-bottom","1.5px solid #F0F0F0");
    $(c3).css("border-bottom","1.5px solid #F0F0F0");
  }
  return c3;
}

function insertInListInbox(rowid,tinfo,tdate){
  let taskid = parseInt(rowid);
  let val = 0;
  if(checkIfAlreadyInserted(taskid)==0){
    if($(".allthetasks").length == 0){
      $(".tasks-list").prepend("<table class=allthetasks></table>")
    }
    $(".allthetasks").append("<tr id="+taskid+"></tr>");
    let trid = "#"+taskid;
    val = setTableRows(trid,tinfo,tdate);
  }
  updateleftindextasksvalue();
  return val;
}

function insertalltasks(){
  leftindexitemclicked = 1;
  removePropertiesOfOtherView();
  $(".heading").append("<h4 class=maintitle>Inbox</h4");
  canceltask();
  $(this).siblings().css("background-color","#FAFAFA");
  $(this).css("background-color","#FFF");
  tasksDb.transaction(
    function(tx){
      tx.executeSql('SELECT * FROM tasks_list ORDER BY id'
        ,[ ]
        ,function(tx,result){
          for(let i=1;i<=result.rows.length;i++){
            let c3= insertInListInbox(result.rows.item(i-1)["id"],
              result.rows.item(i-1)["taskinfo"],result.rows.item(i-1)["taskdate"]);
            selectDateDisplay(result.rows.item(i-1)["taskdate"],c3);
          }
        });
    });
}

function updateleftindextasksvalue(){
  let target1 = ".frow>h5";
  let target2 = ".srow>h5";
  let target3 = ".trow>h5";
  $(".dynamicnumbers").remove();
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list"
        ,[ ]
        ,function(tx,result){
          let totaltasks=0, today=0, next7days=0;
          totaltasks = result.rows.length;
          for(let i=0;i<result.rows.length;i++){
            let rowdate = result.rows.item(i)["taskdate"];
            manipulateReturnedDate(rowdate);
            if(rowdate != ""){
              if(rtime-ctime<=timetoday-ctime && rtime>ctime)
                today +=1;
              else if(rtime-ctime<=time7-ctime && rtime>ctime)
                next7days +=1;
            }
          }
          if($(".dynamicnumbers").length==0){
            $(target1).append(" <div class=dynamicnumbers>"+ totaltasks+" </div>");
            $(target2).append(" <div class=dynamicnumbers>"+ today+" </div>");
            $(target3).append(" <div class=dynamicnumbers>"+ next7days +" </div>");
          }
        });
    });
}

function initializeTodayView(){
  leftindexitemclicked = 2;
  $(".heading").append("<h4 class=maintitle>Today</h4");
  if($(".overduetoday").length==0)
    $(".tasks-list").prepend("<div class=overduetoday><h4>Overdue</h4></div");
  if($(".today").length==0)
    $(".overduetoday").after("<div class=today><h4>Today</h4></div");
  $(".overduetoday").append("<table class=allthetasks></table>");
  $(".today").append("<table class=allthetasks></table>");
}

function initializeNext7DaysView(){
  leftindexitemclicked = 3;
  $(".heading").append("<h4 class=maintitle>Next 7 days</h4");
  for(let i=7;i>=1;i--){
    let dayValue = "day"+i;
    $(".tasks-list").prepend("<table class ="+dayValue+"></table>");
    findDayValue = "."+dayValue;
    $(".tasks-list").find(findDayValue).addClass("allthetasks");
    let index = (cday+(i))%7;
    let dateUpdated = currentday;
    dateUpdated.setDate(dateUpdated.getDate()+i);
    $(".tasks-list").prepend("<h4 class=weekdayNames>"+weekdays[index]+
      " <span class=dateInSmall> "+dateUpdated.getDate()+" "+ monthNames[dateUpdated.getMonth()-1]+
      " "+dateUpdated.getFullYear()+"</span></h4>");
    dateUpdated.setDate(dateUpdated.getDate()-i);
  }
}

function createMultipleAddTasks(){
  let source = ".addtask";
  let temp = $(source);
  for(let i=1;i<=6;i++){
    let placeFormAt = ".day"+i;
    temp.clone().insertAfter(placeFormAt);
    let formClass = "formoftable";
    $(placeFormAt).next().addClass(formClass);
  }
}

function manipulateReturnedDate(rowdate){
  returneddate = new Date(rowdate);
  returneddate.setMinutes(1);
  rtime = returneddate.getTime()/1000;
  rday = returneddate.getDay();
}

function showtodaystasks(timepassed,flag){
  removePropertiesOfOtherView();
  $(this).siblings().css("background-color","#FAFAFA");
  $(this).css("background-color","#FFF");
  tasksDb.transaction(
    function(tx){
      if(flag==0)
        initializeTodayView();
      else if(flag==1)
        initializeNext7DaysView();
      tx.executeSql("SELECT * FROM tasks_list"
        ,[ ]
        ,function(tx,result){
          if(result.rows.length != 0){
            for(let i=0;i<result.rows.length;i++){
              let rowdate = result.rows.item(i)["taskdate"];
              manipulateReturnedDate(rowdate);
              let taskid = result.rows.item(i)["id"];
              let trid = "#"+taskid;
              if(flag==0){
                if(rtime<ctime)
                  $(".overduetoday table").append("<tr id="+taskid+"></tr>");
                else if(rtime-ctime<=timepassed-ctime)
                  $(".today table").append("<tr id="+taskid+"></tr>");
              }
              else if(flag==1){
                if(rtime-ctime<timepassed-ctime && rtime-ctime>=60*60*24){
                  let dayConcerned = rday-cday;
                  if(dayConcerned<0)
                    dayConcerned = dayConcerned+7;
                  let selectTable = ".day"+dayConcerned;
                  $(selectTable).append("<tr id="+taskid+"></tr>");
                }
              }
              setTableRows(trid,
                result.rows.item(i)["taskinfo"],result.rows.item(i)["taskdate"]);
            }
            createMultipleAddTasks();
          }
        });
    });
}

function showsaveform(){
  canceltask();
  $(".submittask").text("Save");
  if($(".addtaskform").css("display")=="none")
    $(".addtaskform").css("display","block");
}

function showInfoOnTaskToBeUpdatedInForm(rowid){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowid]
        ,function(tx,result){
          $(".taskinfo").val(result.rows.item(0)["taskinfo"]);
          $(".taskdate").val(result.rows.item(0)["taskdate"]);
        });
    });
}

function updatetask(){
  canceltask();
  let row = $(this).parent();
  showsaveform();
  globalRowId = row.attr('id');
  let rowid = globalRowId;
  showInfoOnTaskToBeUpdatedInForm(rowid);
}

