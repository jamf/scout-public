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

function getAllSavedReports(){
  var reports = getRequestObject('/reports/', null, 'GET');
  reports.done(function(reportsList){
    //Create an instance of the report for both computers and mobile
    var computerReports = $("#saved-computer-reports-table").DataTable();
    var mobileReports = $("#saved-mobile-reports-table").DataTable();
    //Clear out the table if it already was rendered
    computerReports.clear();
    mobileReports.clear();
    for (var i = 0; i < reportsList.length; i++){
      var actionButtons = '<button type="button" class="btn btn-success btn-circle" onclick="viewReportResults(\''+reportsList[i].id+'\');"><i class="fa fa-play-circle"></i></button>&nbsp;&nbsp;<button type="button" class="btn btn-info btn-circle" onclick="loadReportById(\''+reportsList[i].id+'\');"><i class="fa fa-eye"></i></button>&nbsp;&nbsp;<button type="button" class="btn btn-warning btn-circle"><i class="fa fa-pencil"></i></button>&nbsp;&nbsp;<button type="button" class="btn btn-danger btn-circle"><i class="fa fa-times"></i></button>&nbsp;&nbsp;';
      if (reportsList[i].type == 'computer'){
        computerReports.row.add([reportsList[i].name, reportsList[i].created, reportsList[i].email, reportsList[i].conditions_count, actionButtons]).draw(false);
      } else {
        mobileReports.row.add([reportsList[i].name, reportsList[i].created, reportsList[i].email, reportsList[i].conditions_count, actionButtons]).draw(false);
      }
    }
  })
  .fail(function(xhr){
    console.log(xhr);
  });
}

function loadReportById(reportId){
  reloadReportPane(false);
  //Make the request to the server to get a saved report
  var report = getRequestObject('/reports/id/' + reportId, null, 'GET');
  report.done(function(reportObject){
    //Load the existing report view
    $("#report-name-field").html(reportObject.name);
    $("#new-report-parent").hide();
    addMultipleReportLineItems(reportObject.line_items);
    //Show the new report UI
    changeReportView('computer', 'view');
  })
  .fail(function(xhr){
    console.log(xhr);
  })
}

function upsertReport(runReport){
  //Check if their is an existing report id loaded into the UI and it should be a save
  if ($("#existing-report-id").val() != ''){
    updateExistingReport();
  } else {
    saveNewReport(runReport);
  }
}

function updateExistingReport(){
  var reportId = $("#existing-report-id").val();
  if (reportId == '' || reportId == null){
    swal('Save Failed.', 'Unable to load an existing report Id.', 'error');
    return;
  }
  //keep a list of all of the search line items to send to the server
  var lineItems = [];
  //for every line item, build an object
  for (var i = 0; i <= window.advanced_search_line_item_count-1; i++){
    lineItems.push({ "order" : i, "condition" : $("#include-value-" + i).val(), "parenthesis_one" : $("#param-one-value-" + i).val(), "operator" : $("#operator-value-" + i).val(), "value" : $("#input-value-" + i).val(), "field" : $("#field-value-" + i).val(), "parenthesis_two" : $("#param-two-value-" + i).val()});
  }
  //Create the report object and post everything to the server
  var reqBody = { name : $("#new-report-name").val(), line_items : lineItems};
  var post = getRequestObject('/reports/update/', reqBody, 'PUT');
  post.done(function(res){
    swal('Report Saved', 'The report has been saved.', 'success');
    //Reset the new report div and reload the table with the new report
    reloadReportPane(true);
  })
  .fail(function(xhr){
    swal('Save Failed.', 'The report has not been saved.', 'error');
  })
}

function saveNewReport(shouldRun){
  if ($("#fields-to-select").val().length == 0){
    swal('Save Failed.', 'Please select some fields to be displayed in this report.', 'error');
  }
  //keep a list of all of the search line items to send to the server
  var lineItems = [];
  //for every line item, build an object
  for (var i = 0; i <= window.advanced_search_line_item_count-1; i++){
    lineItems.push({ "order" : i, "condition" : $("#include-value-" + i).val(), "parenthesis_one" : $("#param-one-value-" + i).val(), "operator" : $("#operator-value-" + i).val(), "value" : $("#input-value-" + i).val(), "field" : $("#field-value-" + i).val(), "parenthesis_two" : $("#param-two-value-" + i).val()});
  }
  //Create the report object and post everything to the server
  var reqBody = { name : $("#new-report-name").val(), type : $("#new-report-type").val(), line_items : lineItems, fields_to_select : $("#fields-to-select").val().join(", ")};
  var post = getRequestObject('/reports/save', reqBody, 'POST');
  post.done(function(res){
    swal('Report Saved', 'The report has been saved.', 'success');
    //Reset the new report div and reload the table with the new report
    reloadReportPane(true);
  })
  .fail(function(xhr){
    swal('Save Failed.', 'The report has not been saved.', 'error');
  })
}

function reloadReportPane(loadFirstItem){
  //hide the new report view
  $('#new-report-div').hide();
  //Clear out the existing report id in case one was added
  $("#existing-report-id").val('');
  $("#new-report-name").val('New Report Name');
  $("#new-report-parent").show();
  //reload the saved reports from the server
  getAllSavedReports();
  //Remove the report line items and clear the name field
  $("#advance-report-criteria").html('');
  $("#new-report-name").val('');
  //Add a new blank line item
  window.advanced_search_line_item_count = 0;
  if (loadFirstItem){
    addReportLineItem(null);
  }
}

function prettyPrintColumnName(input){
  //First replace the periods with dashes
  var pretty = input.replace('.', ' - ');
  return pretty.toLowerCase()
      .split(' ')
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ');
}

function viewReportResults(reportId){
  var getReport = getRequestObject('/reports/search/' + reportId, null, 'GET');
  getReport.done(function(res){
    console.log(res);
    //Create a table in the modal based on the fields to be shown
    var columns = res.fields_to_select.split(",");
    var columnsObjs = [];
    columns.forEach(function(c){
      columnsObjs.push({title : prettyPrintColumnName(c)});
    });
    var resultTable = $("#report-results-table").DataTable({
      columns : columnsObjs
    });
    //Clear it out in case it was previously loaded
    resultTable.clear();
    //For each line item of the report, add it to the display modal
    for (var i = 0; i < res.results.length; i++){
      //Check if it's a computer or mobile device
      var deviceType = getKeyForDeviceObj(res.results[i]);
      var row = [];
      columns.forEach(function(c){
        c = c.replace(/\s/g,'');
        var parentCategory = c.split(".")[0];
        var dataCategory = c.split(".")[1];
        row.push(res.results[i][deviceType][parentCategory][dataCategory]);
      });
      console.log(row);
      //Add a row for the device to the table
      resultTable.row.add(row);
    }
    //Draw the table and show the results modal
    resultTable.draw(false);
    $("#report-display-modal").modal('show');
  })
  .fail(function(xhr){
    console.log(xhr);
  })
}

function getKeyForDeviceObj(obj){
  var key = "computer";
  //Default to computer, if it has a mobile_device key, then go with that
  if ('mobile_device' in obj){
    key = 'mobile_device';
  }
  return key;
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

function addServerToDatabase(url,username,password,cronLimited,cronExpanded){
  var serverObject = { "url" : url, "username" : username, "password" : password, "cronLimited" : cronLimited, "cronExpanded" : cronExpanded};
  $.Toast.showToast({
    "title": "Attempting to contact Jamf Pro Server...",
    "icon": "loading",
    "duration": 15000
  });
  $('#add-server-modal').modal('hide');
  //send it to the server
  var post = getRequestObject('/servers/add', serverObject, 'POST');
  post.done(function(data, textStatus, jqXHR){
    $.Toast.hideToast();
    if (jqXHR.status == 206 && jqXHR.responseText.includes("cron")){
      swal('Server Added', 'The server has been added, but we were unable to verify the server cron jobs. Please restart the server to fix this.', 'warning');
    } else if (jqXHR.status == 206 && jqXHR.responseText.includes("scout admin user")){
      swal('Server Added', 'The server has been added, but we were unable add the scout admin user. Emergency access has been disabled for this server.', 'warning');
    } else {
      swal('Server Added', 'The server has been added.', 'success');
    }
    loadServerTable();
  })
  .fail(function(jqXHR, textStatus, errorThrown){
    console.log(jqXHR);
    console.log(textStatus);
    console.log(errorThrown);
    $.Toast.hideToast();
    swal('Server Upload Failed', 'The server has not been added to the database, please check the console for more details.', 'error');
  })
}

function updateServer(id,url){
  //Fill in some modal details
  $("#update-server-url").val(url);
  $("#update-server-id").val(id);
  $("#update-server-username").val('');
  $("#update-server-modal").modal('show');
}

function doUpdateServer(){
  //Make sure the id is filled out
  if ($("#update-server-id").val() == ''){
    swal('Server Update Failed', 'No server Id was passed to the update function.', 'error');
    return;
  }
  $.Toast.showToast({
    "title": "Attempting to contact Jamf Pro Server...",
    "icon": "loading",
    "duration": 15000
  });
  //Check which fields changed
  var updateObject = {};
  if ($("#update-server-username").val() != ''){
    updateObject.username = $("#update-server-username").val();
  }
  if ($("#update-server-password").val() != ''){
    updateObject.password = $("#update-server-password").val();
  }
  if ($("#update-server-limited-cron").val() != '' && $("#update-server-limited-cron").val() != '* * * * *'){
    updateObject.cron_update = $("#update-server-limited-cron").val();
  }
  if ($("#update-server-expanded-cron").val() != '' && $("#update-server-expanded-cron").val() != '* * * * *'){
    updateObject.cron_update_expanded = $("#update-server-expanded-cron").val();
  }
  //Make sure an update is actually being made
  if (Object.keys(updateObject).length > 0){
    var put = getRequestObject('/servers/update/' + $("#update-server-id").val(), updateObject, 'PUT');
    put.done(function(data, textStatus, jqXHR){
      $.Toast.hideToast();
      swal('Server Updated', 'The server has been updated.', 'success');
      $("#update-server-modal").modal('hide');
      loadServerTable();
    })
    .fail(function(jqXHR, textStatus, errorThrown){
      console.log(jqXHR);
      console.log(textStatus);
      console.log(errorThrown);
      $("#update-server-modal").modal('hide');
      $.Toast.hideToast();
      swal('Server Update Failed', 'The server update failed.', 'error');
    })
  } else {
    $.Toast.hideToast();
    swal('Server Update Failed', 'No fields have been specified to update.', 'error');
  }
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

//A bunch of custom parsers for values that are nested
function parseToTableValue(prop, object){
  if (prop == 'remote_management'){
    return 'Managed: ' + object.managed;
  } else {
    return JSON.stringify(object);
  }
}

function getDeviceLive(type, serial, udid){
  //Show a loading notification
  $.Toast.showToast({
    "title": "Getting device from Jamf Pro server...",
    "icon": "loading",
    "duration": 10000
  });
  //Lookup device by serial and UDID
  var reqBody = { serial : serial, udid : udid};
  //Get expanded inventory from server
  var liveResult = getRequestObject('/devices/live/' + type, reqBody, 'POST');
  liveResult.done(function(result){
    //Get the view to inject into the modal
    $.get("/app-views/device-view.html", function(data) {
      $("#device-pane-view").html(data);
      //Start filling in the tables by key
      var device;
      if (type == "computer"){
        device = result.computer;
      } else {
        device = result.mobile_device;
      }
      $("#device-view-name").html(device.general.name);
      for (var prop in device) {
        if (!device.hasOwnProperty(prop)) {
           continue;
        }
        //If there is a length object, it's a list type
        if (device[prop].length == undefined){
          //Get the table for the given key
          var tableTab = prop + "-table-body";
          //if (tableTab == "general-table-body"){
            //For every key in this value, add a row to the table
            for (var value in device[prop]) {
              if (typeof device[prop][value] === 'object'){
                  $("#" + tableTab).append("<tr><td>"+prettyPrintKey(value)+"</td><td>"+parseToTableValue(value,device[prop][value])+"</td></tr>");
              } else {
                $("#" + tableTab).append("<tr><td>"+prettyPrintKey(value)+"</td><td>"+device[prop][value]+"</td></tr>");
              }
            }
        } else if (device[prop].length == 0){
          //No values
        }
      }
      //Show the modal
      //$("#device-display-modal").modal('show');
      //Change the page to the device view
      changeView('full-device-view');
      $.Toast.hideToast();
      updateQueryStringParam('type',type);
      updateQueryStringParam('serial',serial);
      updateQueryStringParam('udid',udid);
    });
  })
  .fail(function(xhr){
    $.Toast.hideToast();
    $.Toast.showToast({
      "title": "Unable to contact server or find device",
      "icon": "error",
      "duration": 5000
    });
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
  //check if we should show the mdm command buttons
  mobileTable.on( 'select', function ( e, dt, type, indexes ) {
    var rows = mobileTable.rows( { selected: true } ).data();
    //If something is selected
    if (rows.length > 0){
      $("#send-mobile-command-button").show();
    } else {
      $("#send-mobile-command-button").hide();
    }
  });
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
  return '<button onclick="updateServer(\''+id+'\',\''+url+'\');" type="button" id="edit_'+id+'" class="edit_server btn btn-info btn-circle"><i class="fa fa-pencil"></i></button>&nbsp;&nbsp;<button type="button" id="delete_'+id+'" onclick="deleteServer(\''+id+'\')" class="btn btn-danger delete_server btn-circle"><i class="fa fa-times"></i></button>&nbsp;&nbsp;<button type="button" id="access'+id+'" onclick="getServerAccess(\''+id+'\',\''+url+'\')" class="btn btn-success delete_server btn-circle"><i class="fa fa-key"></i></button>&nbsp;&nbsp;<br/><br/><button type="button" class="btn btn-warning btn-circle"><i class="fa fa-laptop"></i></button>&nbsp;&nbsp;<button type="button" class="btn btn-warning btn-circle"><i class="fa fa-mobile"></i></button>';
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
      serverTable.row.add( [s.url, s.username, s.org_name, s.ac, s.cronLimited, s.cronExpanded,getServerButtons(s.id,s.url) ] );
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

window.devices_to_send_mdm_commands = [];
function viewMDMCommands(type){
  var table = $("#" + type).DataTable();
  //Get the selected rows
  var rows = table.rows( { selected: true } ).data();
  //save the devices to send to
  window.devices_to_send_mdm_commands = [];
  for (var i = 0; i < rows.length; i++){
    window.devices_to_send_mdm_commands.push(rows[i]);
  }
  $("#selected-devices-count").html(rows.length);
  //show them the possible commands
  changeView('mobile-commands-view');
}

function sendMDMCommand(deviceType, mdmCommand){
  if (window.devices_to_send_mdm_commands.length == 0){
    swal('Send Failed', 'No devices have been selected.', 'error');
    return;
  }
  //Prompt to ensure they actually want to send the command
  swal({
    title: "Are you sure?",
    text: "Once the MDM Commands have been sent to the various Jamf Pro Servers, this can not be undone. Are you sure you'd like to send this command to " + window.devices_to_send_mdm_commands.length + " devices?",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  })
  .then((willSend) => {
    if (willSend) {
      var devicesObj = { mdmCommand : mdmCommand, deviceType : deviceType, deviceList : window.devices_to_send_mdm_commands};
      var req = getRequestObject('/commands/create', devicesObj, 'POST');
      req.done(function(data){
        swal("The MDM Commands are on their way! They may take a few minutes to complete.", {
          icon: "success",
        });
      })
      .fail(function(xhr){
        console.log(xhr);
      });
      // swal("The MDM Commands are on their way! They may take a few minutes to complete.", {
      //   icon: "success",
      // });
    } else {
      swal("No commands have been sent.");
    }
  });
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
    console.log(data);
    sessionStorage.setItem("auth_token", data.token);
    $('#login-user-modal').modal('hide');
    if (data.is_admin == 1){
      sessionStorage.setItem("is_admin", true);
    }
    renderPage();
    changeView('dashboard-view');
  })
  .fail(function(xhr){
    sessionStorage.setItem("is_admin", false);
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

function getSettingsForAdmin(){
  var req = getRequestObject('/settings/all', null, 'GET');
  req.done(function(data){
    for (var key in data){
      $("#general-settings").append(getSettingsItemHTML(key, key, data[key]));
    }
  })
  .fail(function(xhr){
    console.log(xhr);
  });
  loadUserPermissions();
}

function loadUserPermissions(){
  //Get the users from the database so those can be edited
  var userReq = getRequestObject('/users/all', null, 'GET');
  userReq.done(function(userList){
    //add users to the table
    var usersTable = $("#users-table").DataTable();
    usersTable.clear();
    userList.forEach(function(u){
      var canCreate = getUserEditButton(u.id, 'can_create', u.can_create);
      var canEdit = getUserEditButton(u.id, 'can_edit', u.can_edit);
      var canDelete = getUserEditButton(u.id, 'can_delete', u.can_delete);
      var canEditUsers = getUserEditButton(u.id, 'can_edit_users', u.can_edit_users);
      var mdmCommands = getUserEditButton(u.id, 'mdm_commands', u.mdm_commands);
      usersTable.row.add([u.email, canCreate, canEdit, canDelete, canEditUsers, mdmCommands]).draw(false);
    });
  })
  .fail(function(xhr){
    console.log(xhr);
  });
}

function updatePermission(userId, permission, value){
  //build the request body
  var reqBody = { userId : userId, permission : permission, newValue : value};
  //make the request to the server
  var req = getRequestObject('/settings/user', reqBody, 'PUT');
  req.done(function(result){
    swal('Success', 'User setttings have been updated.', 'success');
    loadUserPermissions();
  })
  .fail(function(xhr){
    console.log(xhr);
    swal('Update Failed', 'Updating the user setting has failed. You may not have permission to do so.', 'error');
  });
}

function getUserEditButton(userId, permission, value){
  if (value == true || value == 1){
    return '<button type="button" class="btn btn-success btn-circle" onclick="updatePermission(\''+userId+'\',\''+permission+'\',false);"><i class="fa fa-check"></i></button>';
  } else {
    return '<button type="button" class="btn btn-danger btn-circle" onclick="updatePermission(\''+userId+'\',\''+permission+'\',true);"><i class="fa fa-times"></i></button>';
  }
}

function updateSettings(){
  //For every settings input, get the id and it's value
  var newFile = {};
  $(".settings-input").each(function(i,e){
    var id = $(this).attr('id');
    var value = $(this).val();
    newFile[id] = value;
  });
  console.log(newFile);
  //Make the request to the server
  var req = getRequestObject('/settings/all', newFile, 'PUT')
  req.done(function(result){
    swal('Success!', 'Your settings have been saved successfully. The server can now be restarted.', 'success');
  })
  .fail(function(xhr){
    console.log(xhr);
    swal('Save Failed.', 'Unable to save settings, check the console for more details.', 'error');
  });
}

function getSettingsItemHTML(title, id, value){
  var html = '<div class="form-group">';
      html += '<label>'+title+'</label>';
      html += '<input class="form-control settings-input" id="'+id+'" value="'+value+'">';
    html += '</div>';
 return html;
}

function fillDataForLineItem(id, data){
  console.log(data);
  //Fill in all of the data
  if (data.condition != ''){
    $("#include-value-" + data.order).val(data.condition);
  }
  if (data.parenthesis_one != 0){
    $("#param-one-value-" + data.order).val('(');
  }
  if (data.parenthesis_two != 0){
    $("#param-two-value-" + data.order).val(')');
  }
  $("#field-value-" + data.order).val(data.field);
  $("#operator-value-" + data.order).val(data.operator);
  $("#input-value-" + data.order).val(data.value);
}

function getReportOptions(){
  var options = [];
  //Make sure it has the most recent fields available to it
  options.push(new Option('--- General ---',''));
  for (var key in window.reporting_fields.general){
    options.push(new Option(window.reporting_fields.general[key],"general." + key));
  }
  options.push(new Option('--- Location ---',''));
  for (var key in window.reporting_fields.location){
    options.push(new Option(window.reporting_fields.location[key],"location." + key));
  }
  options.push(new Option('--- Purchasing ---',''));
  for (var key in window.reporting_fields.purchasing){
    options.push(new Option(window.reporting_fields.purchasing[key],"purchasing." + key));
  }
  options.push(new Option('--- Hardware ---',''));
  for (var key in window.reporting_fields.hardware){
    options.push(new Option(window.reporting_fields.hardware[key],"hardware." + key));
  }
  options.push(new Option('--- Applications ---',''));
  for (var key in window.reporting_fields.applications){
    options.push(new Option(window.reporting_fields.applications[key],"applications." + key));
  }
  return options;
}

function addMultipleReportLineItems(lineItems){
  //First get the view template to be used for all line items
  $.get("/app-views/report-line-item.html", function(data) {
    //for every line item, add it to the view
    for (var i = 0; i < lineItems.length; i++){
      //make a copy of the report data to use as a template
      var template = data;
      template = template.replace(/{ID}/g, i);
      $("#advance-report-criteria").append(template);
      //Add all of the select options
      var options = getReportOptions();
      options.forEach(function(o){
        $("#field-value-"+i).append(o);
      });
      //Populate all of the data
      fillDataForLineItem(i,lineItems[i]);
    }
    advanced_search_line_item_count = lineItems.length;
  });
}

//Keep a count of how many line items there are for advanced search
window.advanced_search_line_item_count = 0;
function addReportLineItem(lineItemToFill){
  //Get the element from the view table
  $.get("/app-views/report-line-item.html", function(data) {
    //Fill in the id for querying data later
    data = data.replace(/{ID}/g, window.advanced_search_line_item_count);
    $("#advance-report-criteria").append(data);
    //Make sure it has the most recent fields available to it
    $(".advanced-report-field-dropdown").append(new Option('--- General ---',''));
    for (var key in window.reporting_fields.general){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.general[key],"general." + key));
    }
    $(".advanced-report-field-dropdown").append(new Option('--- Location ---',''));
    for (var key in window.reporting_fields.location){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.location[key],"location." + key));
    }
    $(".advanced-report-field-dropdown").append(new Option('--- Purchasing ---',''));
    for (var key in window.reporting_fields.purchasing){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.purchasing[key],"purchasing." + key));
    }
    $(".advanced-report-field-dropdown").append(new Option('--- Hardware ---',''));
    for (var key in window.reporting_fields.hardware){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.hardware[key],"hardware." + key));
    }
    $(".advanced-report-field-dropdown").append(new Option('--- Applications ---',''));
    for (var key in window.reporting_fields.applications){
      $(".advanced-report-field-dropdown").append(new Option(window.reporting_fields.applications[key],"applications." + key));
    }
    //Clone select options ito the fields to select
    if (window.advanced_search_line_item_count == 0){
      var $options = $(".advanced-report-field-dropdown > option").clone();
      $("#fields-to-select").selectpicker();
      $('#fields-to-select').append($options);
      $("#fields-to-select").selectpicker("refresh");

    }
    //If the line item isn't null, fill in the data now
    if (lineItemToFill != null){
      fillDataForLineItem(advanced_search_line_item_count,lineItemToFill);
    }
    advanced_search_line_item_count++;
  });
}

function doLogOut(){
  sessionStorage.removeItem("auth_token");
  location.reload();
}

function renderPage(){
  getSupportedReportFields();
  //Check if there is a certian tab to show
  var urlParams = new URLSearchParams(window.location.search);
  //Check if we should load a live device view
  if (urlParams.has('type') && urlParams.has('serial') && urlParams.has('udid')){
    getDeviceLive(urlParams.get('type'), urlParams.get('serial'), urlParams.get('udid'));
  }
  if (urlParams.has('tab')){
    changeView(urlParams.get('tab'));
  }
  //Get all of the Jamf Pro Servers
  loadServerTable();
  updateComputers();
  updateMobileDevices();
  updateTvs();
  loadPatchesTable();
  loadPatchServersTable();
  getAllSavedReports();
  //Setup button listeners
  $("#add-server-button").click(function(){
    addServerToDatabase($("#add-server-url").val(), $("#add-server-username").val(), $("#add-server-password").val(), $("#add-server-limited-cron").val(),$("#add-server-expanded-cron").val());
  });
  $("#add-patch-server-button").click(function(){
    addPatchServerToDatabase($("#add-patch-server-url").val(), $("#add-patch-server-cron").val());
  });
  $("#servers-table-div").show();
  $('#cron-selector-limited').cron({
    onChange: function() {
        $('#add-server-limited-cron').val($(this).cron("value"));
    }
  }); // apply cron with default options
  $('#cron-selector-expanded').cron({
    onChange: function() {
        $('#add-server-expanded-cron').val($(this).cron("value"));
    }
  }); // apply cron with default options
  $('#update-cron-selector-limited').cron({
    onChange: function() {
        $('#update-cron-selector-limited').val($(this).cron("value"));
    }
  }); // apply cron with default options
  $('#update-cron-selector-expanded').cron({
    onChange: function() {
        $('#update-cron-selector-expanded').val($(this).cron("value"));
    }
  }); // apply cron with default options
  $('#patch-cron-selector').cron({
    onChange: function() {
        $('#add-patch-server-cron').val($(this).cron("value"));
    }
  }); // apply cron with default options
  //Add one advanced report criteria to start with
  addReportLineItem(null);
  //Whenever a tab is clicked, update the URL for quick refreshes
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var target = $(e.target).attr("href");
    updateQueryStringParam('tab',target.substring(1,target.length));
  });
  if (sessionStorage.getItem("is_admin") == "true"){
    console.log('get settings');
    getSettingsForAdmin();
  }
}

var urlParams = new URLSearchParams(window.location.search);
function changeViewBack(){
  //If there is something in session storage, show that
  var lastTab = sessionStorage.getItem("last-view");
  if (lastTab != null){
    changeView(lastTab);
  }
}

function changeView(newView){
  //Keep a record of the last tab for a back button
  if ("last-view" in sessionStorage && sessionStorage.getItem("last-view") != urlParams.get('tab')){
    sessionStorage.setItem("last-view", urlParams.get('tab'));
  } else if (!("last-view" in sessionStorage)){
    sessionStorage.setItem("last-view", urlParams.get('tab'));
  }
  //Hide all other views
  $(".view-pane").hide();
  //remove the active class
  $(".sidebar-button").removeClass('active');
  //Show the new one, update the url
  resetURLParams();
  updateQueryStringParam('tab',newView);
  $("#" + newView).show();
  //Add the active class
  //$("#" + newView).addClass('active');
}

function changeReportView(deviceType, operation){
  changeView('create-new-report-view');
  //Add the url params for the type
  updateQueryStringParam('reportType', deviceType);
  updateQueryStringParam('type', operation);
}
//resets all url params that is not navigation based
function resetURLParams(){
  updateQueryStringParam('type',null);
  updateQueryStringParam('serial',null);
  updateQueryStringParam('udid',null);
  updateQueryStringParam('reportType',null);
  updateQueryStringParam('isUpdate',null);
  updateQueryStringParam('type',null);
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
    //Make sure reshow the login if they click out of it
    $('#login-user-modal').on('hidden.bs.modal', function () {
      if (!("auth_token" in sessionStorage)){
        $('#login-user-modal').modal('show');
      }
    })
  } else {
    renderPage();
  }

});
