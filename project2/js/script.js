$("#searchInp").on("keyup", function () {

  // gets the search query and active tab

  const query = $(this).val().trim();
  const tab = activeTab();

  if (tab === "personnel") {
    const departmentID = $("#filterPersonnelDepartment").val();
    const locationID = $("#filterPersonnelLocation").val();

    ajaxRequest("php/searchAll.php", "GET", {
      txt: query,
      departmentID: departmentID,
      locationID: locationID
    }, function (result) {

      if (result.status.code == 200) {
        renderPersonnel("personnelTableBody", result.data.found, "departmentName", "locationName");
      }
    }, function () {
      $("#refreshIcon").removeClass("spin");
    });
  }
  else if (tab === "departments") {
    ajaxRequest("php/searchDepartments.php", "GET", { txt: query }, function (result) {

      if (result.status.code == 200) {
        renderDepartments("departmentTableBody", result.data.found, "departmentName", "locationName");
      }
      else {
        //console.log("Search error: " + result.status.description);
      }
    },
      function () {
        $("#refreshIcon").removeClass("spin");
      });
  }
  else if (tab === "locations") {
    ajaxRequest("php/searchLocations.php", "GET", { txt: query }, function (result) {

      if (result.status.code == 200) {
        renderLocations("locationTableBody", result.data.found, "locationName", "id");
      }
      else {
        //console.log("Search error: " + result.status.description);
      }
    },
      function () {
        $("#refreshIcon").removeClass("spin");
      });
  }
});

$("#refreshBtn").click(function () {

  //spin class added to indicate loading, will be removed in the complete callback of the ajax request in the load functions
  $("#refreshIcon").addClass("spin");

  //timeout 500ms so that refresh animation shows
  setTimeout(function () {
    $("#searchInp").trigger("keyup"); //triggers rerun search handler

  }, 500);

});

$("#filterBtn").click(function () {

  const tab = activeTab();

  //checks active tab

  if (tab === "personnel") {
    openModal("filterPersonnelModal");

    // keeps selected values on reopen
    if ($("#filterPersonnelDepartment option").length === 0) {
      populateDropdown("#filterPersonnelDepartment", "php/getAllDepartments.php", "id", "name", true);
    }
    if ($("#filterPersonnelLocation option").length === 0) {
      populateDropdown("#filterPersonnelLocation", "php/getAllLocations.php", "id", "name", true);
    }

  }

});

$("#filterPersonnelDepartment").change(function () {
  if ($(this).val() !== "") {
    $("#filterPersonnelLocation").val("");
  }
});

$("#filterPersonnelLocation").change(function () {
  if ($(this).val() !== "") {
    $("#filterPersonnelDepartment").val("");
  }
});

$("#filterPersonnelForm").on("submit", function (e) {
  e.preventDefault();

  // Gets the selected filter values
  const departmentID = $("#filterPersonnelDepartment").val();
  const locationID = $("#filterPersonnelLocation").val();
  const search = $("#searchInp").val().trim();


  // Make an AJAX request to the server with the selected filter values
  ajaxRequest("php/searchAll.php", "GET", {
    txt: search,
    departmentID: departmentID,
    locationID: locationID
  }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      renderPersonnel("personnelTableBody", result.data.found, "departmentName", "locationName");
      closeModal("filterPersonnelModal"); //closes filter
    }
    else {
      console.log("Error: " + result.status.description);
    }
  });
});


$("#addBtn").click(function () {
  //active tab opens specific modal
  const tab = activeTab();
  if (tab === "personnel") {
    openModal("addPersonnelModal");
  }
  else if (tab === "departments") {
    openModal("addDepartmentModal");
  }
  else if (tab === "locations") {
    openModal("addLocationModal");
  }
});

$("#personnelBtn").click(function () {
  //so filter is enabled
  $("#filterBtn").prop("disabled", false);
  $("#searchInp").trigger("keyup");
});

$("#departmentsBtn").click(function () {
  //filter disabled
  $("#filterBtn").prop("disabled", true);
  $("#searchInp").trigger("keyup");
});

$("#locationsBtn").click(function () {
  //filter disabled
  $("#filterBtn").prop("disabled", true);
  $("#searchInp").trigger("keyup");
});

/*********PERSONNEL************/
/******************************/
//EDIT PERSONNEL MODAL LOGIC
$("#editPersonnelModal").on("show.bs.modal", function (e) {
  let personnelID = $(e.relatedTarget).attr("data-id");
  //console.log("Sending ID: ", personnelID);

  ajaxRequest("php/getPersonnelByID.php", "GET", { id: personnelID }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {

      let person = result.data.personnel[0];
      //console.log(person);
      //console.log(result.data.personnel);
      $("#editPersonnelEmployeeID").val(person.id);
      $("#editPersonnelFirstName").val(person.firstName);
      $("#editPersonnelLastName").val(person.lastName);
      $("#editPersonnelEmailAddress").val(person.email);
      $("#editPersonnelJobTitle").val(person.jobTitle);

      //populates department dropdown and sets the selected value to the employee's current department
      populateDropdown("#editPersonnelDepartment", "php/getAllDepartments.php", "id", "name", false, person.departmentID);

    } else {
      $("#editPersonnelModal .modal-title").replaceWith(
        "Error retrieving data"
      );
    }
  });
});

//EDIT PERSONNEL FORM SUBMISSION LOGIC
$("#editPersonnelForm").on("submit", function (e) {

  e.preventDefault();

  let data = {
    id: $("#editPersonnelEmployeeID").val(),
    firstName: $("#editPersonnelFirstName").val(),
    lastName: $("#editPersonnelLastName").val(),
    email: $("#editPersonnelEmailAddress").val(),
    jobTitle: $("#editPersonnelJobTitle").val(),
    departmentID: $("#editPersonnelDepartment").val()
  };

  //AJAX request to update personnel with data
  ajaxRequest("php/updatePersonnel.php", "POST", data, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadPersonnel();
      closeModal("editPersonnelModal");
    } else {
      console.log("Error: " + result.status.description);
    }
  });
});

//ADD PERSONNEL MODAL LOGIC
$("#addPersonnelModal").on("show.bs.modal", function (e) {
  populateDropdown("#addPersonnelDepartment", "php/getAllDepartments.php", "id", "name");
  //empty values in form inputs in case there is leftover data from previous adding
  clearFormInputs("#addPersonnelForm");

  //reset error alert
  $("#addPersonnelErrorAlert").addClass("d-none");
  $("#addPersonnelErrorMsg").text("");
});

//ADD PERSONNEL FORM SUBMISSION MODAL LOGIC
$("#addPersonnelForm").on("submit", function (e) {
  e.preventDefault();

  // AJAX call to save form data
  let data = {
    firstName: $("#addPersonnelFirstName").val(),
    lastName: $("#addPersonnelLastName").val(),
    email: $("#addPersonnelEmail").val(),
    jobTitle: $("#addPersonnelJobTitle").val(),
    departmentID: $("#addPersonnelDepartment").val(),
  };

  ajaxRequest("php/addPersonnel.php", "POST", data, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadPersonnel();
      closeModal("addPersonnelModal");
    } else {
      $("#addPersonnelErrorMsg").text(result.status.description);
      $("#addPersonnelErrorAlert").removeClass("d-none");
    }
  });
});

//DELETE PERSONNEL MODAL LOGIC
$("#deletePersonnelModal").on("show.bs.modal", function (e) {
  let personnelID = $(e.relatedTarget).attr("data-id");

  //reset
  $("#deletePersonnelMsg").html("Checking...");
  $("#confirmDeletePersonnelBtn").addClass("d-none");

  ajaxRequest("php/deletePersonnelByID.php", "GET", { id: personnelID }, function (result) {
    if (result.status.code == 200) {
      $("#deletePersonnelMsg").html(`Are you sure that you want to remove the entry for <strong>${result.data.fullName}</strong>?`);
      $("#deletePersonnelID").val(personnelID);
      $("#confirmDeletePersonnelBtn").removeClass("d-none");
    }
  })
});

//DELETE PERSONNEL BUTTON DELETE LOGIC
$("#deletePersonnelForm").on("submit", function (e) {
  e.preventDefault();
  let personnelID = $("#deletePersonnelID").val();
  ajaxRequest("php/deletePersonnelByID.php", "POST", { id: personnelID }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadPersonnel();
      closeModal("deletePersonnelModal");
    } else {
      console.log("Error: " + result.status.description);
    }
  });
});


/*********DEPARTMENT***********/
/*****************************/
//EDIT DEPARTMENT MODAL LOGIC
$("#editDepartmentModal").on("show.bs.modal", function (e) {
  let deptID = $(e.relatedTarget).attr("data-id");
  ajaxRequest("php/getDepartmentByID.php", "GET", { id: deptID }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {

      let dept = result.data.department;
      let locations = result.data.locations;
      //console.log(dept);
      //console.log(locations);
      $("#editDepartmentID").val(dept.id);
      $("#editDepartmentName").val(dept.departmentName);

      populateDropdown("#editDepartmentLocation", "php/getAllLocations.php", "id", "name", false, dept.locationID);
    } else {
      $("#editDepartmentModal .modal-title").replaceWith(
        "Error retrieving data"
      );
    }
  });
});

//EDIT DEPARTMENT FORM SUBMISSION LOGIC
$("#editDepartmentForm").on("submit", function (e) {

  e.preventDefault();

  // AJAX call to save form data
  let data = {
    id: $("#editDepartmentID").val(),
    departmentName: $("#editDepartmentName").val(),
    locationID: $("#editDepartmentLocation").val()
  };

  ajaxRequest("php/updateDepartment.php", "POST", data, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadDepartments();
      closeModal("editDepartmentModal");
    } else {
      console.log("Error: " + result.status.description);
    }
  });
});

//ADD DEPARTMENT MODAL LOGIC
$("#addDepartmentModal").on("show.bs.modal", function (e) {
  //empty values in form inputs in case there is leftover data from previous adding
  clearFormInputs("#addDepartmentForm");
  populateDropdown("#addDepartmentLocation", "php/getAllLocations.php", "id", "name");
  //reset error alert
  $("#addDepartmentErrorAlert").addClass("d-none");
  $("#addDepartmentErrorMsg").text("");
});

//ADD DEPARTMENT FORM SUBMISSION MODAL LOGIC
$("#addDepartmentForm").on("submit", function (e) {

  e.preventDefault();

  // AJAX call to save form data
  let data = {
    departmentName: $("#addDepartmentName").val(),
    locationID: $("#addDepartmentLocation").val()
  };

  ajaxRequest("php/addDepartment.php", "POST", data, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadDepartments();
      closeModal("addDepartmentModal");
    } else {
      $("#addDepartmentErrorMsg").text(result.status.description);
      $("#addDepartmentErrorAlert").removeClass("d-none");
    }
  });
});

//DELETE DEPARTMENT MODAL LOGIC
$("#deleteDepartmentModal").on("show.bs.modal", function (e) {
  let departmentID = $(e.relatedTarget).data("id");

  $("#confirmDeleteDepartmentBtn, #okDeleteDepartmentBtn").addClass("d-none");

  //temp clear and show default
  $("#deleteDepartmentMsg").removeClass("d-none").html("Checking department...");

  //check if departments are assinged
  ajaxRequest("php/deleteDepartmentByID.php", "GET", { id: departmentID }, function (result) {

    if (result.status.code == 200) {

      let deptName = result.data.departmentName;
      let personnelCount = result.data.personnelCount;

      $("#confirmDeleteDepartmentBtn, #noDeleteDepartmentBtn, #okDeleteDepartmentBtn").addClass("d-none");

      if (personnelCount > 0) {
        //cannot remove
        $("#deleteDepartmentModal .modal-title").text("Cannot delete department")
        $("#deleteDepartmentMsg").html(
          `You cannot delete <strong>${deptName}</strong> department. It has <strong>${personnelCount} employees</strong> assigned to it!`);

        //HIDE YES/NO, show OK
        $("#okDeleteDepartmentBtn").removeClass("d-none");

      } else {
        //safe to delete
        $("#deleteDepartmentModal .modal-title").text("Delete department?")
        $("#deleteDepartmentMsg").html(
          `Are you sure that you want to remove the department <strong>${deptName}</strong>?`);

        //stores department id on button 
        $("#deleteDepartmentID").val(departmentID);
        $("#confirmDeleteDepartmentBtn, #noDeleteDepartmentBtn").removeClass("d-none");
      }
    }
  });
});

//DELETE DEPARTMENT BUTTON DELETE CONFIRM LOGIC
$("#deleteDepartmentForm").on("submit", function (e) {
  e.preventDefault();
  let departmentID = $("#deleteDepartmentID").val();

  ajaxRequest("php/deleteDepartmentByID.php", "POST", { id: departmentID }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadDepartments();
      closeModal("deleteDepartmentModal");
    } else {
      console.log("Error: " + result.status.description);
    }
  });
});


/*****LOCATION LOGICS*****/
/**************************/
//EDIT LOCATION MODAL LOGIC
$("#editLocationModal").on("show.bs.modal", function (e) {
  let locationID = $(e.relatedTarget).attr("data-id");

  ajaxRequest("php/getLocationByID.php", "GET", { id: locationID }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      let location = result.data.location[0];

      $("#editLocationID").val(location.id);
      $("#editLocationName").val(location.locationName);

    } else {
      $("#editLocationModal .modal-title").replaceWith(
        "Error retrieving data"
      );
    }
  });
});

//EDIT LOCATION FORM SUBMISSION LOGIC
$("#editLocationForm").on("submit", function (e) {

  e.preventDefault();

  // AJAX call to save form data
  let data = {
    id: $("#editLocationID").val(),
    locationName: $("#editLocationName").val()
  };

  ajaxRequest("php/updateLocation.php", "POST", data, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadLocations();
      closeModal("editLocationModal");
    } else {
      console.log("Error: " + result.status.description);
    }
  });
});

//ADD LOCATION MODAL LOGIC
$("#addLocationModal").on("show.bs.modal", function (e) {
  //empty values in form inputs in case there is leftover data from previous adding
  clearFormInputs("#addLocationForm");
  //reset error alert
  $("#addLocationErrorAlert").addClass("d-none");
  $("#addLocationErrorMsg").text("");
});

//ADD LOCATION FORM SUBMISSION MODAL LOGIC
$("#addLocationForm").on("submit", function (e) {

  e.preventDefault();

  ajaxRequest("php/addLocation.php", "POST", { locationName: $("#addLocationName").val() }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadLocations();
      closeModal("addLocationModal");
    } else {
      $("#addLocationErrorMsg").text(result.status.description);
      $("#addLocationErrorAlert").removeClass("d-none");
    }
  });
});


//DELETE LOCATION MODAL LOGIC
$("#deleteLocationModal").on("show.bs.modal", function (e) {
  let locationID = $(e.relatedTarget).data("id");

  $("#confirmDeleteLocationBtn, #noDeleteLocationBtn, #okDeleteLocationBtn").addClass("d-none");

  //temp clear and show default
  $("#deleteLocationMsg").removeClass("d-none").html("Checking location...");

  //check if departments are assinged to location
  ajaxRequest("php/deleteLocationByID.php", "GET", { id: locationID }, function (result) {

    if (result.status.code == 200) {
      let locationName = result.data.locationName;
      let departmentCount = result.data.departmentCount;

      if (departmentCount > 0) {
        //cannot remove
        $("#deleteLocationModal .modal-title").text("Cannot delete location");
        $("#deleteLocationMsg").html(
          `You cannot delete <strong>${locationName}</strong> location. It has <strong>${departmentCount} departments</strong> assigned to it!`
        );
        //only ok button
        $("#okDeleteLocationBtn").removeClass("d-none");

      } else {
        $("#deleteLocationModal .modal-title").text("Delete location?");
        $("#deleteLocationMsg").html(
          `Are you sure that you want to remove the location <strong>${locationName}</strong>?`
        );
        $("#deleteLocationID").val(locationID);
        $("#confirmDeleteLocationBtn, #noDeleteLocationBtn").removeClass("d-none");
      }
    }
  });
});

//DELETE LOCATION BUTTON DELETE CONFIRM LOGIC
$("#deleteLocationForm").on("submit", function (e) {
  e.preventDefault();
  let locationID = $("#deleteLocationID").val();

  ajaxRequest("php/deleteLocationByID.php", "POST", { id: locationID }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      loadLocations();
      closeModal("deleteLocationModal");
    } else {
      console.log("Error: " + result.status.description);
    }
  });
});

//LOAD DATA FUNCTIONS
/*******************/
function loadPersonnel() {

  ajaxRequest("php/getAll.php", "GET", {}, function (result) {

    if (result.status.code == 200) {
      renderPersonnel("personnelTableBody", result.data, "department", "location");
    }
    else {
      console.log("Error: " + result.status.description);
    }
  }, function () {
    $("#refreshIcon").removeClass("spin");
  });
}

function loadDepartments() {
  ajaxRequest("php/getAllDepartments.php", "GET", {}, function (result) {

    if (result.status.code == 200) {

      renderDepartments("departmentTableBody", result.data, "name", "location");
    }
    else {
      console.log("Error: " + result.status.description);
    }
  }, function () {
    $("#refreshIcon").removeClass("spin");
  });
}

function loadLocations() {
  ajaxRequest("php/getAllLocations.php", "GET", {}, function (result) {

    if (result.status.code == 200) {
      renderLocations("locationTableBody", result.data, "name", "id");
    }
    else {
      console.log("Error: " + result.status.description);
    }
  }, function () {
    $("#refreshIcon").removeClass("spin");
  });
}

//function for dropdown
function populateDropdown(selector, url, valueKey, textKey, includeAllOption = false, selectedValue = null) {
  var dropdown = document.querySelector(selector);
  dropdown.innerHTML = "";

  if (includeAllOption) {
    var allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All";
    dropdown.append(allOption);
  }

  ajaxRequest(url, "GET", {}, function (result) {
    if (result.status.code == 200) {
      result.data.forEach(item => {
        var option = document.createElement("option");
        option.value = item[valueKey];
        option.textContent = item[textKey];
        dropdown.append(option)
      });
      if (selectedValue !== null) {
        dropdown.value = selectedValue;
      }
    } else {
      console.log("Error: " + result.status.description);
    }
  });
}

//open modals
function openModal(modalID) {
  if (document.activeElement) {
    document.activeElement.blur();
  }
  const modal = new bootstrap.Modal(document.getElementById(modalID));
  modal.show();
}

//close modals
function closeModal(modalID) {
  const modal = bootstrap.Modal.getInstance(document.getElementById(modalID));
  if (modal) {
    modal.hide();
  }
}

//activeTab
function activeTab() {
  if ($("#personnelBtn").hasClass("active")) {
    return "personnel";
  }
  else if ($("#departmentsBtn").hasClass("active")) {
    return "departments";
  }
  else if ($("#locationsBtn").hasClass("active")) {
    return "locations";
  }
}

//clear form inputs 
function clearFormInputs(formSelector) {
  $(formSelector).find("input").val("");
}

//generic ajax function to reduce code repetition. Takes url, method type, data to be sent, success callback function, and optional complete callback function as parameters
function ajaxRequest(url, type, data, onSuccess, onComplete) {
  $.ajax({
    url: url,
    type: type,
    dataType: "json",
    data: data,
    success: onSuccess,
    complete: function () {
      if (typeof onComplete === "function") {
        onComplete();
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error("AJAX Error: ", textStatus, errorThrown);
      console.log("Response Text: ", jqXHR.responseText);
    }
  });
}

function createActionButtons(modalTarget, id) {
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-primary btn-sm";
  btn.setAttribute("data-bs-toggle", "modal");
  btn.setAttribute("data-bs-target", "#" + modalTarget); //modal
  btn.setAttribute("data-id", id);

  var icon = document.createElement("i"); //html tag i
  icon.className = modalTarget.includes("edit") ? "fa-solid fa-pencil fa-fw" : "fa-solid fa-trash fa-fw";

  btn.append(icon);
  return btn;
}

//render tables frag
//personnel
function renderPersonnel(tbodyID, data, deptField, locField) {
  var frag = document.createDocumentFragment();

  if (!data || data.length === 0) {
    var row = document.createElement("tr");
    var td = document.createElement("td");

    td.colSpan = 5;
    td.append(document.createTextNode("No results found"));

    row.append(td);
    frag.append(row);
  }
  else {
    data.forEach(function (person) {
      var row = document.createElement("tr");

      var tdName = document.createElement("td");
      tdName.textContent = person.lastName + ", " + person.firstName;
      row.append(tdName);

      var tdDept = document.createElement("td");
      tdDept.textContent = person[deptField];
      row.append(tdDept);

      var tdLoc = document.createElement("td");
      tdLoc.textContent = person[locField];
      row.append(tdLoc);

      var tdEmail = document.createElement("td");
      tdEmail.textContent = person.email;
      row.append(tdEmail);

      var tdActions = document.createElement("td");
      tdActions.className = "text-end text-nowrap";

      tdActions.append(createActionButtons("editPersonnelModal", person.id));
      tdActions.append(document.createTextNode(" "));
      tdActions.append(createActionButtons("deletePersonnelModal", person.id));

      row.append(tdActions);
      frag.append(row);
    })
  }
  var tbody = document.getElementById(tbodyID);
  tbody.innerHTML = "";
  tbody.append(frag);
}

//departments
function renderDepartments(tbodyID, data, nameField, locField) {
  var frag = document.createDocumentFragment();

  if (!data || data.length === 0) {
    var row = document.createElement("tr");
    var td = document.createElement("td");

    td.colSpan = 5;
    td.append(document.createTextNode("No results found"));

    row.append(td);
    frag.append(row);
  }
  else {
    data.forEach(function (dept) {
      var row = document.createElement("tr");

      var tdName = document.createElement("td");
      tdName.textContent = dept[nameField];
      row.append(tdName);

      var tdLoc = document.createElement("td");
      tdLoc.textContent = dept[locField];
      row.append(tdLoc);

      var tdActions = document.createElement("td");
      tdActions.className = "text-end text-nowrap";

      tdActions.append(createActionButtons("editDepartmentModal", dept.id));
      tdActions.append(document.createTextNode(" "));
      tdActions.append(createActionButtons("deleteDepartmentModal", dept.id));

      row.append(tdActions);
      frag.append(row);
    })
  }
  var tbody = document.getElementById(tbodyID);
  tbody.innerHTML = "";
  tbody.append(frag);
}

//locations
function renderLocations(tbodyID, data, nameField, idField) {
  var frag = document.createDocumentFragment();

  if (!data || data.length === 0) {
    var row = document.createElement("tr");
    var td = document.createElement("td");
    td.colSpan = 2;
    td.append(document.createTextNode("No results found"));
    row.append(td);
    frag.append(row);
  } else {
    data.forEach(function (location) {
      var row = document.createElement("tr");

      var tdName = document.createElement("td");
      tdName.textContent = location[nameField];
      row.append(tdName);

      var tdActions = document.createElement("td");
      tdActions.className = "text-end text-nowrap";

      tdActions.append(createActionButtons("editLocationModal", location.id));
      tdActions.append(document.createTextNode(" "));
      tdActions.append(createActionButtons("deleteLocationModal", location.id));

      row.append(tdActions);
      frag.append(row);
    });
  }

  var tbody = document.getElementById(tbodyID);
  tbody.innerHTML = "";
  tbody.append(frag);
}


$(document).ready(function () {

  $(".modal").on("hide.bs.modal", function () {
    const focused = this.querySelector(":focus");
    if (focused) focused.blur();
  });

  loadPersonnel();
  loadDepartments();
  loadLocations();
});




