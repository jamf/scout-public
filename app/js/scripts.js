function getSupportedReportFields(){
  var fields = getRequestObject('/reports/builder/fields', null, 'GET');
  fields.done(function(fieldsObject){
    //Store this as a global object so it can also be added to the report builder without making the request again
    window.reporting_fields = fieldsObject;
  })
  .fail(function(xhr){
    console.log(xhr);
  });
}

function doAdvancedSearch(){
  //keep a list of all of the search line items to send to the server
  var lineItems = [];
  //for every line item, build an object
  for (var i = 0; i <= window.advanced_search_line_item_count; i++){
    lineItems.push({ "junction" : $("#include-value-" + i).val(), "param-one" : $("#param-one-value-" + i).val(), "operator" : $("#operator-value-" + i).val(), "value" : $("#input-value-" + i).val(), "field" : $("#field-value-" + i).val(), "param-two" : $("#param-two-value-" + i).val()});
  }
  //Post the object to the server
  var reqBody = { search_line_items : lineItems};
  var post = getRequestObject('/reports/search', reqBody, 'POST');
  post.done(function(res){
    console.log(res);
  })
  .fail(function(xhr){
    console.log(xhr);
  })
}

function addServerToDatabase(url,username,password,cron){
  var serverObject = { "url" : url, "username" : username, "password" : password, "cron" : cron};
  $("#loading-modal").modal('show');
  $('#add-server-modal').modal('hide');

  //send it to the server
  var post = getRequestObject('/servers/add', serverObject, 'POST');
  post.done(function(res){
    $("#loading-modal").modal('hide');
    swal('Server Added', 'The server has been addded to the database successfully.', 'success');
    loadServerTable();
  })
  .fail(function(xhr){
    $("#loading-modal").modal('hide');
    swal('Server Upload Failed', 'The server has not been added to the database, please check the console for more details.', 'error');
    console.log(xhr);
  })
}

function addPatchServerToDatabase(url,cron){
  var serverObject = { "url" : url, "cron" : cron};
  //send it to the server
  var post = getRequestObject('/patches/create', serverObject, 'POST');
  post.done(function(res){
    $('#add-patch-server-modal').modal('hide');
    swal('Server Added', 'The server has been addded to the database successfully.', 'success');
    loadServerTable();
  })
  .fail(function(xhr){
    swal('Server Upload Failed', 'The server has not been added to the database, please check the console for more details.', 'error');
    console.log(xhr);
  })
}

function prettyPrintKey(input){
  //First replace the underscores with spaces
  var pretty = input.replace(/_/g, ' ');
  return pretty.toLowerCase()
      .split(' ')
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ');
}

function getDeviceLive(type, serial, udid){
  //Lookup device by serial and UDID
  var reqBody = { serial : serial, udid : udid};
  //Get expanded inventory from server
  var liveResult = getRequestObject('/devices/live/' + type, reqBody, 'POST');
  liveResult.done(function(result){
    //Get the view to inject into the modal
    $.get("/app-views/device-view.html", function(data) {
      $("#device-modal-view").html(data);
      //Start filling in the tables by key
      var device;
      if (type == "computer"){
        device = result.computer;
      } else {
        device = result.mobile_device;
      }
      for (var prop in device) {
        if (!device.hasOwnProperty(prop)) {
           continue;
        }
        //Get the table for the given key
        var tableTab = prop + "-table-body";
        //if (tableTab == "general-table-body"){
          //For every key in this value, add a row to the table
          for (var value in device[prop]) {
            $("#" + tableTab).append("<tr><td>"+prettyPrintKey(value)+"</td><td>"+device[prop][value]+"</td></tr>");
          }
      }
      //Show the modal
      $("#device-display-modal").modal('show');
    });
  })
  .fail(function(xhr){
    console.log(xhr);
  });
}

function updateComputers(){
  var computerTable = $("#computers-table").DataTable(getDataTablesRequest('computer'));
  var computers = getRequestObject('/devices/count/computer', null, 'GET');
  //Get a count of the total devices seperate since data tables can't handle success functions
  computers.done(function(computers){
    $("#macos-device-count").html(computers.size);
  })
  .fail(function(xhr){
    console.log(xhr);
  });
}

function updateTvs(){
  var tvsTable = $("#tvs-table").DataTable(getDataTablesRequest('tv'));
  var tvs = getRequestObject('/devices/count/tv', null, 'GET');
  //Get a count of the total devices seperate since data tables can't handle success functions
  tvs.done(function(tvs){
    $("#tvos-device-count").html(tvs.size);
  })
  .fail(function(xhr){
    console.log(xhr);
  });
}

function updateMobileDevices(){
  var mobileTable = $("#mobiledevices-table").DataTable(getDataTablesRequest('mobile'));
  var mobile = getRequestObject('/devices/count/mobile', null, 'GET');
  //Get a count of the total devices seperate since data tables can't handle success functions
  mobile.done(function(mobiledevices){
    $("#ios-device-count").html(mobiledevices.size);
  })
  .fail(function(xhr){
    console.log(xhr);
  });
}

function deleteServer(id){
  var serverDelete = getRequestObject('/servers/delete/' + id.toString(), null, 'DELETE');
  serverDelete.done(function(res){
    console.log(res);
    swal('Server Deleted', 'The server and all of it\'s devices have been removed.', 'success');
    loadServerTable();
  })
  .fail(function(xhr){
    console.log(xhr);
  });
}

function getServerAccess(id,url){
  $("#get-server-access-key").modal('show');
  $("#backup_password_url").val(url);
}

function getServerButtons(id,url){
  return '<button type="button" id="edit_'+id+'" class="edit_server btn btn-info btn-circle"><i class="fa fa-pencil"></i></button>&nbsp;&nbsp;<button type="button" id="delete_'+id+'" onclick="deleteServer(\''+id+'\')" class="btn btn-danger delete_server btn-circle"><i class="fa fa-times"></i></button>&nbsp;&nbsp;<button type="button" id="access'+id+'" onclick="getServerAccess(\''+id+'\',\''+url+'\')" class="btn btn-success delete_server btn-circle"><i class="fa fa-key"></i></button>&nbsp;&nbsp;<br/><br/><button type="button" class="btn btn-warning btn-circle"><i class="fa fa-laptop"></i></button>&nbsp;&nbsp;<button type="button" class="btn btn-warning btn-circle"><i class="fa fa-mobile"></i></button>';
}

function loadServerTable(){
  var serverTable = $("#server-table").DataTable();
  serverTable.clear();
  var servers = getRequestObject('/servers', null, 'GET');
  //render the table after the servers are loaded from the DB
  servers.done(function(servers){
    $("#server-count").html(servers.servers.length);
    //Add to the server table
    for (i = 0; i < servers.servers.length; i++){
      var s = servers.servers[i];
      console.log(s);
      serverTable.row.add( [s.url, s.username, s.org_name, s.ac, s.cron,getServerButtons(s.id,s.url) ] );
    }
    serverTable.draw();
  })
  .fail(function(xhr) {
    console.log(xhr);
  })
}

function loadPatchesTable(){
  var patchesTable = $("#patches-table").DataTable();
  patchesTable.clear();
  var patches = getRequestObject('/patches/software', null, 'GET');
  //render the table after the servers are loaded from the DB
  patches.done(function(patchList){
    //Add to the server table
    for (i = 0; i < patchList.length; i++){
      patchesTable.row.add([patchList[i].name, patchList[i].publisher,patchList[i].id,patchList[i].currentVersion,patchList[i].lastModified]);
    }
    patchesTable.draw();
  })
  .fail(function(xhr) {
    console.log(xhr);
  })
}

function loadPatchServersTable(){
  var patchServersTable = $("#patch-servers-table").DataTable();
  patchServersTable.clear();
  var patchServers = getRequestObject('/patches/servers', null, 'GET');
  //render the table after the servers are loaded from the DB
  patchServers.done(function(patchServerList){
    console.log(patchServerList);
    //Add to the server table
    for (i = 0; i < patchServerList.length; i++){
      patchServersTable.row.add([patchServerList[i].base_url, patchServerList[i].cron_update]);
    }
    patchServersTable.draw();
  })
  .fail(function(xhr) {
    console.log(xhr);
  })
}

function doLoginLDAP(){
  var loginObj = {"username" : $("#login-username").val(), "password" : $("#login-password").val()};
  var req = getRequestObject('/users/login/ldap', loginObj, 'POST');
  req.done(function(data){
    sessionStorage.setItem("auth_token", data.token);
    $('#login-modal').modal('hide');
    renderPage();
  })
  .fail(function(xhr){
    $(".login-group").addClass("has-error");
  })
}

function doBackupPasswordRequest(){
  var body = { "url" : $("#backup_password_url").val()};
  var backupRequest = getRequestObject('/servers/access/', body, 'POST');
  //render the table after the servers are loaded from the DB
  backupRequest.done(function(response){
    swal('Password Retrieved', 'Your emergency password is: ' + response.password + ' . Do not loose this, as it has now been removed from the database and can no longer be returned.', 'warning');
    $('#get-server-access-key').modal('hide');
  })
  .fail(function(xhr) {
    swal('Password Retrieve Failed', 'Unable to retrieve emergency password. If this a real emergency, get the password from the database and decrypt it using your private key set upon Scout setup.', 'error');
  })
}

function doLoginUserPass(){
  var loginObj = {"email" : $("#login-user-username").val(), "password" : $("#login-user-password").val()};
  var req = getRequestObject('/users/login/basic', loginObj, 'POST');
  req.done(function(data){
    sessionStorage.setItem("auth_token", data.token);
    $('#login-user-modal').modal('hide');
    renderPage();
  })
  .fail(function(xhr){
    $(".login-group").addClass("has-error");
  })
}

function registerUser(){
  var loginObj = {"email" : $("#register-email").val(), "password" : $("#register-password").val(), "register_pin" : $("#register-pin").val()};
  var req = getRequestObject('/users/create', loginObj, 'POST');
  req.done(function(data){
    sessionStorage.setItem("auth_token", data.token);
    $('#login-user-modal').modal('hide');
    $('#register-modal').modal('hide');
    renderPage();
  })
  .fail(function(xhr){
    $(".login-group").addClass("has-error");
  })
}

//Keep a count of how many line items there are for advanced search
window.advanced_search_line_item_count = 0;
function addReportLineItem(){
  //Get the element from the view table
  $.get("/app-views/report-line-item.html", function(data) {
    //Fill in the id for querying data later
    data = data.replace(/{ID}/g, window.advanced_search_line_item_count);
    $("#advance-report-criteria").append(data);
    //Make sure it has the most recent fields available to it
    $(".advanced-report-field-dropdown").append(new Option('--- General ---',''));
    for (var key in window.reporting_fields.general){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.general[key],key));
    }
    $(".advanced-report-field-dropdown").append(new Option('--- Location ---',''));
    for (var key in window.reporting_fields.location){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.location[key],key));
    }
    $(".advanced-report-field-dropdown").append(new Option('--- Purchasing ---',''));
    for (var key in window.reporting_fields.purchasing){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.purchasing[key],key));
    }
    $(".advanced-report-field-dropdown").append(new Option('--- Hardware ---',''));
    for (var key in window.reporting_fields.hardware){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.hardware[key],key));
    }
    $(".advanced-report-field-dropdown").append(new Option('--- Applications ---',''));
    for (var key in window.reporting_fields.applications){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.applications[key],key));
    }
    advanced_search_line_item_count++;
  });
}

function doLogOut(){
  sessionStorage.removeItem("auth_token");
  location.reload();
}

function renderPage(){
  //Check if there is a certian tab to show
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('tab')){
    //Show that tab
    $('.nav-tabs a[href="#'+urlParams.get('tab')+'"]').tab('show')
  }
  //Get all of the Jamf Pro Servers
  loadServerTable();
  updateComputers();
  updateMobileDevices();
  updateTvs();
  loadPatchesTable();
  loadPatchServersTable();
  getSupportedReportFields();
  //Setup button listeners
  $("#add-server-button").click(function(){
    addServerToDatabase($("#add-server-url").val(), $("#add-server-username").val(), $("#add-server-password").val(), $("#add-server-cron").val());
  });
  $("#add-patch-server-button").click(function(){
    addPatchServerToDatabase($("#add-patch-server-url").val(), $("#add-patch-server-cron").val());
  });
  $("#servers-table-div").show();
  $('#cron-selector').cron({
    onChange: function() {
        $('#add-server-cron').val($(this).cron("value"));
    }
  }); // apply cron with default options
  $('#patch-cron-selector').cron({
    onChange: function() {
        $('#add-patch-server-cron').val($(this).cron("value"));
    }
  }); // apply cron with default options
  //Add one advanced report criteria to start with
  addReportLineItem();
  //Whenever a tab is clicked, update the URL for quick refreshes
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var target = $(e.target).attr("href");
    updateQueryStringParam('tab',target.substring(1,target.length));
  });
}


//Wait for the page to render
$(document).ready(function(){
  if (!("auth_token" in sessionStorage)){
    $("#login-button").click(function(){
      doLoginLDAP();
    });
    $("#login-user-button").click(function(){
      doLoginUserPass();
    });
    $("#register-button").click(function(){
      registerUser();
    });
    $('#login-user-modal').modal('show');
  } else {
    renderPage();
  }

});
