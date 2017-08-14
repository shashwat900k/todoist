$(document).ready(function(){

  $(window).on('resize',checkWidth);

  $(".index-toggle-links").on('click',toggleIndex);

  $('.add-task').on('click', showForm);

  $(document).on('click','.add-task-next7days',showForm);

  $(".submit-task").on('click',checkAndSubmit);

  $(".cancel-task").on('click',cancelTask);

  $(".tasks-list").on('click','.column1',addDeletedTaskToArchivedTasksTable);

  $(".first-row").on('click',insertAllTasks);

  $(".second-row").on('click',function(){
    showTodaysTasks(timeToday,0);
  });

  $('body').bind('mousewheel', function(e) {
    var $div = $('.main-body');
    $div.scrollTop($div.scrollTop()- e.originalEvent.wheelDelta);
    return false;
  });


  $(".third-row").on('click',function(){
    showTodaysTasks(timeInNext7Days,1);
  });
  $(".tasks-list").on('click',".column2",updateTask);

  tasksDb = window.openDatabase("tasksdatabase", "1.0", "WebSQL database", 5*1024*1024);
  instantiateDataBase();

  customizeDatePicker();
  checkWidth();
  insertAllTasks();
  updateLeftIndexTasksValue();

});
//        Global Variables        //
let currentDay = new Date();
currentDay.setHours(0);
currentDay.setMinutes(0);
currentDay.setSeconds(0);
let currentTimeInSeconds = currentDay.getTime()/1000;
let currentWeekday = currentDay.getDay();
let timeToday = currentTimeInSeconds + 60*60*24*1;
let timeInNext7Days = currentTimeInSeconds + 60*60*24*7;
let leftIndexItemClicked = -1;
let weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"
  ,"Saturday"];
let globalRowId = 0,findDayValue=0;
let monthNames = ["Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
let returnedDate=0,returnedTimeInSeconds=0,returnedWeekday=0;

//      All DB related functions here   //
function instantiateDataBase()
{
  createTableTaskList();
  createTableTaskDeleted();
}

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

function insertRowInDb(tInfo,tdate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "INSERT INTO tasks_list(taskinfo,taskdate) VALUES(?,?)"
        ,[tInfo,tdate]
      )});
}

function updateRowInDb(rowId,tInfo,tdate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowId]
        ,function(tx,result){
          if(tInfo.length!=0){
            tasksDb.transaction(
              function(tx){
                tx.executeSql("UPDATE tasks_list SET taskinfo=?, taskdate=? WHERE id=?"
                  ,[tInfo,tdate,rowId]);
              });
          }
        });
    });
}

function addDeletedTaskToArchivedTasksTable(){
  let taskToDelete = $(this).parent();
  let taskId = parseInt(taskToDelete.attr('class'));
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[taskId]
        ,function(tx,result){
          tx.executeSql("INSERT INTO deletedtasks(id,taskinfo,taskdate) VALUES(?,?,?)"
            ,[result.rows.item(0)["id"]
              ,result.rows.item(0)["taskinfo"]
              ,result.rows.item(0)["taskdate"]]
          );
        });
    });
  $(taskToDelete).remove();
  deleteTheRow(taskId);
  updateLeftIndexTasksValue();
  cancelTask();
}

function deleteTheRow(taskId){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("DELETE FROM tasks_list WHERE id = ?",
        [taskId])});
}
//   ////////////////////////////////////////////////////////////

function customizeDatePicker(){
  $(".task-date").datepicker({
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
    $(".left-index ul").addClass("left-index-mobile-property");
  else
    $(".left-index ul").removeClass("left-index-mobile-property");
}

function toggleIndex(){
  if($(".left-index").css('display') === 'none'){
    $(".left-index").toggle();
    $(".left-index").removeClass("hidden-xs col-sm-4").addClass("left-index-toggle");
    $(".main-body").removeClass("col-xs-12").addClass("small-main-body");
    $(".index-toggle-links").addClass("fa-times").removeClass("fa-bars")
      .addClass("left-index-toggle-bars");
  }
  else{
    $(".left-index").toggle();
    $(".left-index").removeClass("left-index-toggle").addClass("hidden-xs col-sm-4");
    $(".main-body").removeClass("small-main-body").addClass("col-xs-12");
    $(".index-toggle-links").removeClass("fa-times").addClass("fa-bars")
      .removeClass("left-index-toggle-bars");
  }
}

function showDefaultDate(_this){
  if(leftIndexItemClicked==2)
    $(".task-date").datepicker("setDate",new Date());
  else{
    let defaultDate = _this.prev().prev().find('.date-in-small').text();
    $(".task-date").datepicker("setDate",new Date(defaultDate));
  }
}

function showForm(){
  let _this = $(this);
  $(".add-task-form").insertAfter(_this);
  $(".add-task-form").show();
  if(leftIndexItemClicked!=1)
    showDefaultDate(_this);
}

function decideWhichViewToUpdateAndShow(){
  if(leftIndexItemClicked==1)
    insertAllTasks();
  else if(leftIndexItemClicked==2)
    showTodaysTasks(timeToday,0);
  else if(leftIndexItemClicked==3)
    showTodaysTasks(timeInNext7Days,1);
}

function checkAndSubmit(){
  let tInfo = $(".task-info").val();
  let tdate = $(".task-date").val();
  if($(".submit-task").text()!="Save"){
    console.log("should not be printed");
    if($(".task-info").val().length>0){
      insertRowInDb(tInfo,tdate);
      cancelTask();
      decideWhichViewToUpdateAndShow();
    }
  }
  else{
    let rowId = parseInt(globalRowId);
    if(tInfo.length>0){
      updateRowInDb(rowId,tInfo,tdate);
      updateLeftIndexTasksValue();
      $(".submit-task").text("Add Task");
      cancelTask();
      decideWhichViewToUpdateAndShow();
    }
  }
}

function cancelTask(){
  console.log("should  be cancelled");
  $(".add-task-form").css("display","none");
  $(".task-info").val('');
  $(".task-date").val('');
  if($(".submit-task").text()=="Save")
    $(".submit-task").text("Add Task");
}

function removePropertiesOfOtherView(){
  cancelTask();
  $(".page-content").hide();
  $(".page-specific-heading").hide();
}

function selectDateDisplay(rowDate,columnContainingTaskDate){
  manipulatereturnedDate(rowDate);
  if(returnedTimeInSeconds-currentTimeInSeconds<=1*60*60*24 && returnedTimeInSeconds>currentTimeInSeconds)
    $(columnContainingTaskDate).text("Today");
  else if(returnedTimeInSeconds-currentTimeInSeconds<=7*60*60*24 && returnedTimeInSeconds>=currentTimeInSeconds){
    if(returnedWeekday-currentWeekday==1 || returnedWeekday+7-currentWeekday==1){
      $(columnContainingTaskDate).text("Tomorrow");
      $(columnContainingTaskDate).css({"text-decoration":"underline","text-decoration-color":"#166CEC"});
    }
    else{
      $(columnContainingTaskDate).text(weekdays[returnedDate.getDay()]);
      $(columnContainingTaskDate).css({"text-decoration":"underline","text-decoration-color":"#FFB504"});
    }
  }
}

function setTableRows(tableName,trid,tInfo,tdate){
  let rowTableCombination = tableName+">"+trid;
  for(let j=1;j<=3;j++)
    $(rowTableCombination).append("<td class=column"+j+"></td>");
  let columnContainingCheckbox =rowTableCombination+">.column1";
  let columnContainingTaskInfo = rowTableCombination+">.column2";
  let columnContainingTaskDate = rowTableCombination+">.column3";
  $(columnContainingCheckbox).html("<button></button>");
  $(columnContainingTaskInfo).html(tInfo);
  $(columnContainingTaskDate).html(tdate);
  if(leftIndexItemClicked!=3){
    $(columnContainingTaskInfo).css("border-bottom","1.5px solid #F0F0F0");
    $(columnContainingTaskDate).css("border-bottom","1.5px solid #F0F0F0");
  }
  return columnContainingTaskDate;
}

function insertRowInTable(tableName,rowId){
  $(tableName).append("<tr class="+rowId+"></tr>");
}

function checkIfAlreadyInserted(tableName,taskId){
  let searchtaskId = tableName+">"+"."+taskId;
  return $(searchtaskId).length==0?0:1;
}

function insertInListInbox(rowId,tInfo,tdate,tableName){
  let taskId = parseInt(rowId);
  let val = 0;
  if(checkIfAlreadyInserted(tableName,taskId)==0){
    insertRowInTable(tableName,taskId);
    let trid = "."+taskId;
    val = setTableRows(tableName,trid,tInfo,tdate);
  }
  updateLeftIndexTasksValue();
  return val;
}

function insertAllTasks(){
  leftIndexItemClicked = 1;
  removePropertiesOfOtherView();
  $(".inbox-heading").show();
  $(".content-index-page").show();
  cancelTask();
  $(this).siblings().css("background-color","#FAFAFA");
  $(this).css("background-color","#FFF");
  tasksDb.transaction(
    function(tx){
      tx.executeSql('SELECT * FROM tasks_list ORDER BY id'
        ,[ ]
        ,function(tx,result){
          for(let i=1;i<=result.rows.length;i++){
            let columnContainingTaskDate= insertInListInbox(result.rows.item(i-1)["id"],
              result.rows.item(i-1)["taskinfo"],result.rows.item(i-1)["taskdate"],".all-the-tasks");
            selectDateDisplay(result.rows.item(i-1)["taskdate"],columnContainingTaskDate);
          }
        });
    });
}

function updateLeftIndexTasksValue(){
  let target1 = ".first-row>h5";
  let target2 = ".second-row>h5";
  let target3 = ".third-row>h5";
  $(".dynamic-numbers").remove();
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list"
        ,[ ]
        ,function(tx,result){
          let totaltasks=0, today=0, next7days=0;
          totaltasks = result.rows.length;
          for(let i=0;i<result.rows.length;i++){
            let rowDate = result.rows.item(i)["taskdate"];
            manipulatereturnedDate(rowDate);
            if(rowDate != ""){
              if(returnedTimeInSeconds-currentTimeInSeconds<=timeToday-currentTimeInSeconds && returnedTimeInSeconds>currentTimeInSeconds)
                today +=1;
              else if(returnedTimeInSeconds-currentTimeInSeconds<=timeInNext7Days-currentTimeInSeconds && returnedTimeInSeconds>currentTimeInSeconds)
                next7days +=1;
            }
          }
          if($(".dynamic-numbers").length==0){
            $(target1).append(" <div class=dynamic-numbers>"+ totaltasks+" </div>");
            $(target2).append(" <div class=dynamic-numbers>"+ today+" </div>");
            $(target3).append(" <div class=dynamic-numbers>"+ next7days +" </div>");
          }
        });
    });
}

function initializeTodayView(){
  leftIndexItemClicked = 2;
  $(".today-heading").show();
  $(".content-today-page").show();
  $(".add-task").show();
}

function initializeNext7DaysView(){
  leftIndexItemClicked = 3;
  $(".add-task").show();
  $(".next7days-heading").show();
  $(".content-next7days-page").show();
  for(let i=7;i>=1;i--){
    let dayValue = "day"+i;
    let weekdayValue = ".weekday"+i;
    let index = (currentWeekday+(i))%7;
    let dateUpdated = currentDay;
    dateUpdated.setDate(dateUpdated.getDate()+i);
    $(weekdayValue).html(weekdays[index]+"<span class=date-in-small> "+dateUpdated.getDate()+" "+ monthNames[dateUpdated.getMonth()-1]+
      " "+dateUpdated.getFullYear()+"</span></h4>");
    dateUpdated.setDate(dateUpdated.getDate()-i);
  }
}

function createMultipleAddTasks(){
  if($(".add-task-next7days").length==0){
    for(let i=1;i<=7;i++){
      let placeFormAt = ".day"+i;
      $(".add-task").clone().insertAfter(placeFormAt);
      let placeFormAtChild = placeFormAt+"+.add-task";
      console.log(placeFormAtChild);
      $(placeFormAtChild).removeClass("add-task").addClass("add-task-next7days");
    }
  }
  $(".add-task").hide();
}

function manipulatereturnedDate(rowDate){
  returnedDate = new Date(rowDate);
  returnedDate.setMinutes(1);
  returnedTimeInSeconds = returnedDate.getTime()/1000;
  returnedWeekday = returnedDate.getDay();
}

function showTodaysTasks(timepassed,flag){
  removePropertiesOfOtherView();
  let leftIndexElement = ".second-row";
  if(flag==0)
    initializeTodayView();
  if(flag==1){
    leftIndexElement = ".third-row";
    initializeNext7DaysView();
  }
  $(leftIndexElement).siblings().css("background-color","#FAFAFA");
  $(leftIndexElement).css("background-color","#FFF");
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list"
        ,[ ]
        ,function(tx,result){
          if(result.rows.length != 0){
            for(let i=0;i<result.rows.length;i++){
              let tableName = "";
              let rowDate = result.rows.item(i)["taskdate"];
              manipulatereturnedDate(rowDate);
              let taskId = result.rows.item(i)["id"];
              let trid = "."+taskId;
              if(flag==0){
                if(returnedTimeInSeconds<currentTimeInSeconds){
                  tableName = ".overdue-tasks";
                }
                else if(returnedTimeInSeconds-currentTimeInSeconds<=timepassed-currentTimeInSeconds){
                  tableName = ".todays-tasks";
                }
                if(checkIfAlreadyInserted(tableName,taskId)==0){
                  insertRowInTable(tableName,taskId);
                  setTableRows(tableName,trid,
                    result.rows.item(i)["taskinfo"],result.rows.item(i)["taskdate"]);
                }
              }
              else if(flag==1){
                if(returnedTimeInSeconds-currentTimeInSeconds<timepassed-currentTimeInSeconds && returnedTimeInSeconds-currentTimeInSeconds>=60*60*24){
                  let dayConcerned = returnedWeekday-currentWeekday;
                  if(dayConcerned<0)
                    dayConcerned = dayConcerned+7;
                  let selectTable = ".day"+dayConcerned;
                  if(checkIfAlreadyInserted(selectTable,taskId)==0){

                    $(selectTable).append("<tr class="+taskId+"></tr>");
                    setTableRows(selectTable,trid,
                      result.rows.item(i)["taskinfo"],result.rows.item(i)["taskdate"]);
                  }
                }
              }
            }
            if(flag==1)
              createMultipleAddTasks();
          }
        });
    });
}

function showsaveform(){
  cancelTask();
  $(".submit-task").text("Save");
  if($(".add-task-form").css("display")=="none")
    $(".add-task-form").css("display","block");
}

function showInfoOnTaskToBeUpdatedInForm(rowId){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowId]
        ,function(tx,result){
          $(".task-info").val(result.rows.item(0)["taskinfo"]);
          $(".task-date").val(result.rows.item(0)["taskdate"]);
        });
    });
}

function updateTask(){
  cancelTask();
  let row = $(this).parent();
  showsaveform();
  globalRowId = row.attr('id');
  let rowId = globalRowId;
  showInfoOnTaskToBeUpdatedInForm(rowId);
}

