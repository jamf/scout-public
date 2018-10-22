var serverUrl = window.server_host;

function returnCurrentPage(){
  if(window.location.href.indexOf("login") > -1) {
    return "login";
  } else if (window.location.href.indexOf("register") > -1){
    return "register";
  } else if (window.location.href.indexOf("dash") > -1){
    return "dashboard";
  }
}

function checkLogin(){
    if (!("auth_token" in sessionStorage)){
      sessionStorage.setItem("previousPage", "settings.html");
      $(location).attr('href','login.html');
    }
}

function getDataTablesRequest(platform){
  var obj = {
    serverSide : true,
    ajax : {
      headers: { 'Authorization': 'Bearer '+sessionStorage.getItem("auth_token") },
      url : serverUrl + '/devices/paged/'+platform,
      type: 'POST',
      dataType: 'json',
      columns: [
        { data : "Name" },
        { data : "JPS Name" },
        { data : "Model" },
        { data : "Serial" },
        { data : "Last Inventory" },
        { data : "UDID" },
        { data : "Managed" },
        { data : "Action" }
      ]
    }
  }
  return obj;
}

function getRequestObject(url, data, method){
  if ("auth_token" in sessionStorage){
    if (data != null){
      return jqXhr = $.ajax({
        headers: { 'Authorization': 'Bearer '+sessionStorage.getItem("auth_token") },
        url: serverUrl + url,
        contentType: 'application/json',
        dataType: 'json',
        type: method,
        data: JSON.stringify(data)
      });
    } else {
      return jqXhr = $.ajax({
        headers: { 'Authorization': 'Bearer '+sessionStorage.getItem("auth_token") },
        url: serverUrl + url,
        contentType: 'application/json',
        dataType: 'json',
        type: method
      });
    }
  } else if (data != null) {
    return jqXhr = $.ajax({
      url: serverUrl + url,
      contentType: 'application/json',
      dataType: 'json',
      type: method,
      data: JSON.stringify(data)
    });
  } else {
    return jqXhr = $.ajax({
      url: serverUrl + url,
      contentType: 'application/json',
      dataType: 'json',
      type: method
    });
  }
}
