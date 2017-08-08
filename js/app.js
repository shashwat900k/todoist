$(document).ready(function(){

  $(window).on('resize',checkWidth);

  $(".index-toggle-links").on('click',toggleIndex);
  //$(".page-link").on('click',pageProperty);

  $(document).on('click','.addtask', showform);

  $(".tasks-list").on('click',".submittask",checkandsubmit);

  $(".tasks-list").on('click',".canceltask",canceltask);

  $(".tasks-list").on('click','.column1',deletetask);

  $(".frow").on('click',insertalltasks);

  $(".srow").on('click',function(){
    showtodaystasks(timetoday,0);
  });

  $(".trow").on('click',function(){
    showtodaystasks(time7,1);
  });

  /*$(".addtaskform").on('click','.savetask',function(){
    savetask();
  });*/

  $(".tasks-list").on('click',".column2",updatetask);

  checkWidth();


  $(".taskdate").datepicker({
    autoclose: true,
    clearBtn: true,
    format: 'd M yyyy',
    todayHighlight: true,
    startDate: new Date()
  });

  tasksDb = window.openDatabase("tasksdatabase", "1.0", "WebSQL database", 5*1024*1024);

  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS tasks_list"+
        "(id INTEGER PRIMARY KEY AUTOINCREMENT"+
        ", taskinfo TEXT"+
        ", taskdate DATETIME)"
      )});
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS deletedtasks"+
        "(id INTEGER PRIMARY KEY"+
        ", taskinfo TEXT"+
        ", taskdate DATETIME)"
      )});
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

function checkWidth(){

  let width = $(window).width();
  if(width<753){
    $(".index-toggle").css("visibility","visible");
    $(".left-index").css("visibility","hidden");
  }
  else if(width>=753){
    $(".index-toggle").css("visibility","hidden");
    $(".left-index").css("visibility","visible");
    if($(".fa-times").length>0){
      $(".index-toggle-links").removeClass("fa-times");
      $(".index-toggle-links").addClass("fa-bars");
    }
  }
  if(width<820){
    $(".left-index ul").css("padding-left","25%");
  }
  else{
    $(".left-index ul").css("padding-left","40%");
  }

}

function toggleIndex(){

  if($(".left-index").css('visibility') === 'hidden'){
    $(".left-index").css("visibility","visible");
    $(".left-index").removeClass("hidden-xs");
    $(".left-index").removeClass("col-sm-4");
    $(".left-index").css({"width":"300px", "z-index":"2","position":"absolute","background-color":"#FAFAFA"});
    $(".main-body").removeClass("col-xs-12");
    $(".main-body").css("width","100%");
    $(".index-toggle-links").addClass("fa-times");
    $(".index-toggle-links").removeClass("fa-bars");
    $(".index-toggle-links").css({"color": "#fff","background-color":"#DB4C3F"});
  }

  else{
    $(".left-index").css("visibility","hidden");
    $(".left-index").css({"width":"","z-index":"","position":""});
    $(".left-index").addClass("hidden-xs");
    $(".left-index").addClass("col-sm-4");
    $(".main-body").css("width","");
    $(".main-body").addClass("col-xs-12");
    $(".index-toggle-links").removeClass("fa-times").addClass("fa-bars");
    $(".index-toggle-links").css({"background-color": "#DB4C3F","color":"#fff"});
  }

}

function showFormNext7Days(_this,detachedForm){
  $(_this).addClass("showParticularForm");
  canceltask();
  //let cloneOfForm = $(".addtaskform").clone(true);
  //console.log(detachedForm);
  $(detachedForm).insertAfter(".showParticularForm");
  //$(cloneOfForm).addClass("addtaskformcloned");
  if($(".addtaskform").css("display")=="none"){
    console.log("Hi");
    $(".addtaskform").css("display","block");
  }
  else {
    checkandsubmit();
  }
}

function showform(){
  $(".addtask").removeClass("showParticularForm");
  $(".addtaskformcloned").remove();
  let detachedForm = null;
  if($(".addtask").length>5){
    let _this = $(this);
    detachedFormGlobal = $(".addtaskform").detach();
    console.log(detachedForm);
    showFormNext7Days(_this,detachedFormGlobal);
  }
  else{
    if(detachedFormGlobal != 0){
      detachedForm = detachedFormGlobal;
      $(detachedForm).insertBefore('.addtask');
    }
    //console.log("in show form");
    //console.log(detachedForm);
    canceltask();
    if($(".addtaskform").css("display")=="none")
      $(".addtaskform").css("display","block");
    else {
      //checkandsubmit();
    }
  }
}

function checkandsubmit(){
  if($(".savetask").length==0){
    console.log("should not be printed");
    if($(".taskinfo").val().length>0){
      let tinfo = $(".taskinfo").val();
      let tdate = $(".taskdate").val();
      tasksDb.transaction(
        function(tx){
          tx.executeSql(
            "INSERT INTO tasks_list(taskinfo,taskdate) VALUES(?,?)"
            ,[tinfo,tdate]
          )});
      insertinlist(tinfo,tdate);
      canceltask();
      //if($(".addtask").length>5){
      //  $(".addtaskform").appendTo((".addtask"));
      //}
    }
  }
}

function insertinlist(tinfo,tdate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql('SELECT * FROM tasks_list WHERE taskinfo =?'
        ,[tinfo]
        ,function(tx,result){
          let taskid = result.rows.item(0)["id"];

          if($(".allthetasks").length == 0){
            $(".tasks-list").prepend("<table class=allthetasks></table>")
          }
          let dateConcerned = new Date(tdate);
          let dateConcernedTime =  dateConcerned.getTime();
          if(dateConcernedTime-ctime<=24*60*60 && $(".today").length!=0){
            $(".today table").append("<tr id="+taskid+"></tr>");
          }
          /* else if($(".today").length==0){
            $(".tasks-list table").append("<tr id="+taskid+"></tr>");
          }*/
          let trid = "#"+taskid;
          for(let j=1;j<=3;j++){
            $(trid).append("<td class=column"+j+"></td>");
          }
          let c1 =trid+">.column1";
          let c2 = trid+">.column2";
          let c3 = trid+">.column3";

          $(c1).append("<button></button>");
          $(c2).append(result.rows.item(0)["taskinfo"]);
          $(c3).append(result.rows.item(0)["taskdate"]);
        });
    });
  updateleftindextasksvalue();
}

function canceltask(){
  console.log(new Date());
  $(".addtaskform").css("display","none");
  $(".taskinfo").val('');
  $(".taskdate").val('');
  if($(".savetask").length>0){
    $(".savetask").addClass("submittask");
    $(".submittask").removeClass("savetask");
    $(".submittask").text("Add Task");

  }
}

function insertalltasks(){
  while($(".addtask").length>1){
    $(".addtask").not(":last").remove();
  }
  $(".maintitle").remove();
  $(".overduetoday").remove();
  $(".today").remove();
  if($(".weekdayNames").length!=0)
    $(".weekdayNames").remove();
  for(let i=7;i>=1;i--){
    let dayValue = ".day"+i;
    if($(dayValue).length!=0)
      $(dayValue).remove();
  }
  $(".heading").append("<h4 class=maintitle>Inbox</h4");
  leftindexitemclicked = 1;
  canceltask();
  $(".allthetasks").remove();
  $(this).siblings().css("background-color","#FAFAFA");
  $(this).css("background-color","#FFF");
  tasksDb.transaction(
    function(tx){
      tx.executeSql('SELECT * FROM tasks_list ORDER BY id'
        ,[ ]
        ,function(tx,result){

          $(".tasks-list").prepend("<table class=allthetasks></table>")
          for(let i=1;i<=result.rows.length;i++){
            let taskid = result.rows.item(i-1)["id"];
            let trid = "#"+taskid;
            $(".tasks-list table").append("<tr id="+taskid+"></tr>");
            for(let j=1;j<=3;j++){
              $(trid).append("<td class=column"+j+"></td>");
            }
          }
          $(".column1").append("<button></button>");
          for(let i=1;i<=result.rows.length;i++){
            let taskid = result.rows.item(i-1)["id"];
            let trid = "#"+taskid;
            let c2 = trid+">.column2";
            let c3 = trid+">.column3";
            let rowdata = result.rows.item(i-1)["taskdate"];
            let returneddate = new Date(rowdata);
            returneddate.setMinutes(1);
            let rtime = returneddate.getTime()/1000;
            let rday = returneddate.getDay();
            $(c2).append(result.rows.item(i-1)["taskinfo"]);
            //console.log(rtime,ctime,(rtime-ctime)/60*60, result.rows.item(i-1)["taskdate"],currentday,returneddate);
            if(rtime-ctime<=1*60*60*24 && rtime>ctime){
              $(c3).append("Today");
            }
            else if(rtime-ctime<=7*60*60*24 && rtime>=ctime){
              let weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
              let colors = []
              if(returneddate.getDay()-currentday.getDay()==1){
                $(c3).append("Tomorrow");
                $(c3).css({"text-decoration":"underline","text-decoration-color":"#166CEC"});
              }
              else{
                $(c3).append(weekday[returneddate.getDay()]);
                $(c3).css({"text-decoration":"underline","text-decoration-color":"#FFB504"});

              }
            }
            else{
              $(c3).append(result.rows.item(i-1)["taskdate"]);
            }
            $(c2).css("border-bottom","1.5px solid #F0F0F0");
            $(c3).css("border-bottom","1.5px solid #F0F0F0");
          }
        });
    });

}

function deletetask(){
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

function updateleftindextasksvalue(){
  let target1 = ".frow>h5";
  let target2 = ".srow>h5";
  let target3 = ".trow>h5";
  $(".dynamicnumbers").remove();
  let totaltasks=0, today=0, next7days=0;
  tasksDb.transaction(
    function(tx){

      tx.executeSql("SELECT * FROM tasks_list"
        ,[ ]
        ,function(tx,result){
          let totaltasks = result.rows.length;
          for(let i=0;i<result.rows.length;i++){
            let rowdata = result.rows.item(i)["taskdate"];
            let returneddate = new Date(rowdata);
            returneddate.setMinutes(1);
            let rtime = returneddate.getTime()/1000;

            if(rowdata != ""){
              if(rtime-ctime<=timetoday-ctime && rtime>ctime){
                today +=1;
              }
              else if(rtime-ctime<=time7-ctime && rtime>ctime){
                next7days +=1;
              }
            }
          }
          $(target1).append(" <div class=dynamicnumbers>"+ totaltasks+" </div>");
          $(target2).append(" <div class=dynamicnumbers>"+ today+" </div>");
          $(target3).append(" <div class=dynamicnumbers>"+ next7days +" </div>");

        });
    });
}

function showtodaystasks(timepassed,flag){

  let weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"
    ,"Saturday"];
  if($(".weekdayNames").length!=0)
    $(".weekdayNames").remove();
  for(let i=7;i>=1;i--){
    let dayValue = ".day"+i;
    if($(dayValue).length!=0)
      $(dayValue).remove();
  }
  while($(".addtask").length>1){
    $(".addtask").not(":last").remove();
  }
  canceltask();
  $(this).siblings().css("background-color","#FAFAFA");
  $(this).css("background-color","#FFF");
  tasksDb.transaction(
    function(tx){
      if(flag==0){
        //console.log("wohooo");
        $(".maintitle").remove();
        $(".heading").append("<h4 class=maintitle>Today</h4");
        leftindexitemclicked = 2;
        $(".srow").siblings().css("background-color","#FAFAFA");
        $(".srow").css("background-color","#FFF");
        if($(".overduetoday").length==0)
          $(".tasks-list").prepend("<div class=overduetoday><h4>Overdue</h4></div");
        if($(".today").length==0)
          $(".overduetoday").after("<div class=today><h4>Today</h4></div");
        tx.executeSql("SELECT * FROM tasks_list"
          ,[ ]
          ,function(tx,result){
            $(".allthetasks").remove();
            if(result.rows.length != 0){
              $(".overduetoday").append("<table class=allthetasks></table>");
              $(".today").append("<table class=allthetasks></table>");
              for(let i=0;i<result.rows.length;i++){
                let rowdata = result.rows.item(i)["taskdate"];
                let returneddate = new Date(rowdata);
                returneddate.setMinutes(1);
                let rtime = returneddate.getTime()/1000;
                let rday = returneddate.getDay();
                if(rowdata != ""){
                  if(rtime<ctime){
                    let taskid = result.rows.item(i)["id"];
                    let trid = "#"+taskid;
                    $(".overduetoday table").append("<tr id="+taskid+"></tr>");
                    for(let j=1;j<=3;j++){
                      $(trid).append("<td class=column"+j+"></td>");
                    }
                    let c1 = trid+">.column1";
                    let c2 = trid+">.column2";
                    let c3 = trid+">.column3";
                    $(c1).append("<button></button>");
                    $(c2).append(result.rows.item(i)["taskinfo"]);
                    $(c3).append(result.rows.item(i)["taskdate"]);
                  }
                  else{
                    if(rtime-ctime<=timepassed-ctime){
                      let taskid = result.rows.item(i)["id"];
                      let trid = "#"+taskid;
                      $(".today table").append("<tr id="+taskid+"></tr>");
                      for(let j=1;j<=3;j++){
                        $(trid).append("<td class=column"+j+"></td>");
                      }
                      let c1 = trid+">.column1";
                      let c2 = trid+">.column2";
                      let c3 = trid+">.column3";
                      $(c1).append("<button></button>");
                      $(c2).append(result.rows.item(i)["taskinfo"]);
                      $(c3).append(result.rows.item(i)["taskdate"]);
                    }
                  }
                }
              }
            }
            else{

            }
          });

      }
      else{
        $(".overduetoday").remove();
        $(".today").remove();
        $(".maintitle").remove();
        $(".heading").append("<h4 class=maintitle>Next 7 days</h4");
        leftindexitemclicked = 3;
        $(".trow").siblings().css("background-color","#FAFAFA");
        $(".trow").css("background-color","#FFF");
        $(".allthetasks").remove();
        let currentdayConcerned = currentday.getDay();
        for(let i=7;i>=1;i--){
          let dayValue = "day"+i;
          $(".tasks-list").prepend("<table class ="+dayValue+"></table>");
          findDayValue = "."+dayValue;
          $(".tasks-list").find(findDayValue).addClass("allthetasks");
          let index = (currentdayConcerned+(i))%7;
          let dateUpdated = currentday;
          dateUpdated.setDate(dateUpdated.getDate()+i);
          var monthNames = ["Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          //console.log("wwwwwwwww");
          $(".tasks-list").prepend("<h4 class=weekdayNames>"+weekdays[index]+" <span class=dateInSmall> "+dateUpdated.getDate()+" "+ monthNames[dateUpdated.getMonth()-1]+" "+dateUpdated.getFullYear()+"</span></h4>");
          dateUpdated.setDate(dateUpdated.getDate()-i);
        }
        tx.executeSql("SELECT * FROM tasks_list"
          ,[ ]
          ,function(tx,result){

            if(result.rows.length != 0){
              for(let i=0;i<result.rows.length;i++){
                let rowdata = result.rows.item(i)["taskdate"];
                let returneddate = new Date(rowdata);
                returneddate.setMinutes(1);
                let rtime = returneddate.getTime()/1000;
                if(rowdata != ""){
                  if(rtime-ctime<timepassed-ctime){
                    if(rtime-ctime>=60*60*24){
                      //console.log("Heyya");
                      let taskid = result.rows.item(i)["id"];
                      let trid = "#"+taskid;
                      let dayConcerned = returneddate.getDay()-currentdayConcerned;
                      if(dayConcerned<0)
                        dayConcerned = dayConcerned+7;
                      let selectTable = ".day"+dayConcerned;
                      //console.log(selectTable);
                      $(selectTable).append("<tr id="+taskid+"></tr>");
                      for(let j=1;j<=3;j++){
                        $(trid).append("<td class=column"+j+"></td>");
                      }
                      let c1 = trid+">.column1";
                      let c2 = trid+">.column2";
                      let c3 = trid+">.column3";
                      $(c1).append("<button></button>");
                      $(c2).append(result.rows.item(i)["taskinfo"]);

                    }
                  }
                }
              }
            }
          });
        let source = ".addtask";
        let temp = $(source);
        for(let i=1;i<=6;i++){
          let placeFormAt = ".day"+i;
          //console.log(placeFormAt);
          temp.clone().insertAfter(placeFormAt);
          let formClass = "formoftable";
          $(placeFormAt).next().addClass(formClass);
          //$(temp).append(placeFormAt);
          //source = placeFormAt;
        }
      }
    });
}

function showsaveform(){
  canceltask();
  $(".submittask").addClass("savetask");
  $(".savetask").removeClass("submittask");
  $(".savetask").text("Save");
  if($(".addtaskform").css("display")=="none")
    $(".addtaskform").css("display","block");
}

function updatetask(){
  canceltask();
  //console.log("hey");

  let row = $(this).parent();
  /*let dest = $(this);
  let width = row.css("width");
  $("<tr class=temprow></tr>").insertAfter(row);
  $("<td class = tempcol></td>").appendTo(".temprow");
  $(".addtaskform").detach().appendTo(".tempcol");
  $(".tempcol").css({"width":width,"display":"block","clear":"both"});
  */

  let rowid = row.attr('id');
  showsaveform();
  tasksDb.transaction(
    function(tx){
      //console.log("yo");
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowid]
        ,function(tx,result){
          $(".taskinfo").val(result.rows.item(0)["taskinfo"]);
          $(".taskdate").val(result.rows.item(0)["taskdate"]);
        });
    });
  $(".addtaskform").on('click','.savetask',function(){
    savetask(rowid);
  });
}

function savetask(id){
  let rowid = parseInt(id);
  let flag = 0;
  //console.log(rowid);
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowid]
        ,function(tx,result){
          let tinfo = $(".taskinfo").val();
          let tdate = $(".taskdate").val();
          //console.log(tinfo,tdate,rowid);
          if(tinfo.length!=0){
            flag = 1;
            //console.log(flag);
            tasksDb.transaction(
              function(tx){
                tx.executeSql("UPDATE tasks_list SET taskinfo=?, taskdate=? WHERE id=?"
                  ,[tinfo,tdate,rowid]
                  ,function(tx,result){
                    //console.log(result);
                  }
                );
              });
            canceltask();
            updateleftindextasksvalue();
            //console.log("hey");
            //console.log(leftindexitemclicked);
            if(leftindexitemclicked==1){
              insertalltasks();
            }
            else if(leftindexitemclicked==2){
              showtodaystasks(timetoday,0);
            }
            else if(leftindexitemclicked==3){
              showtodaystasks(time7,1);
            }
          }
        });
    });
}
