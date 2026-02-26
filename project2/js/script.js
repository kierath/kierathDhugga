$("#searchInp").on("keyup", function () {

  // gets the search query and active tab

  const query = $(this).val().trim();
  const tab = activeTab();

  if (tab === "personnel") {
    ajaxRequest("php/searchAll.php", "GET", { txt: query }, function (result) {

      if (result.status.code == 200) {
        const found = result.data.found;
        let rows = "";

        if (found.length === 0) {
          rows = `<tr><td colspan = "5">No results found</td></tr>`;
        }

        else {
          found.forEach(person => {
            rows += `
          <tr>
            <td>${person.lastName}, ${person.firstName}</td>
            <td>${person.departmentName}</td>
            <td>${person.locationName}</td>
            <td>${person.email}</td>
            <td class="text-end text-nowrap">
              <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
              data-bs-target="#editPersonnelModal" data-id="${person.id}">
              <i class="fa-solid fa-pencil fa-fw"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deletePersonnelModal" data-id="${person.id}">
                  <i class="fa-solid fa-trash fa-fw"></i>
                </button>
              </td>
            </tr>`;
          });
        }
        $("#personnelTableBody").html(rows);
      }
      else {
        //console.log("Search error: " + result.status.description);
      }
    });
  }
  else if (tab === "departments") {
    ajaxRequest("php/searchDepartments.php", "GET", { txt: query }, function (result) {

      if (result.status.code == 200) {
        const found = result.data.found;
        let rows = "";

        if (found.length === 0) {
          rows = `<tr><td colspan = "5">No results found</td></tr>`;
        }

        else {
          found.forEach(department => {
            rows += `
          <tr>
            <td>${department.departmentName}</td>
            <td>${department.locationName}</td>
            <td class="text-end text-nowrap">
              <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
              data-bs-target="#editDepartmentModal" data-id="${department.id}">
              <i class="fa-solid fa-pencil fa-fw"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deleteDepartmentModal" data-id="${department.id}">
                  <i class="fa-solid fa-trash fa-fw"></i>
                </button>
              </td>
            </tr>`;
          });
        }
        $("#departmentTableBody").html(rows);
      }
      else {
        //console.log("Search error: " + result.status.description);
      }
    });
  }
  else if (tab === "locations") {
    ajaxRequest("php/searchLocations.php", "GET", { txt: query }, function (result) {

      if (result.status.code == 200) {
        const found = result.data.found;
        let rows = "";

        if (found.length === 0) {
          rows = `<tr><td colspan = "5">No results found</td></tr>`;
        }

        else {
          found.forEach(location => {
            rows += `
          <tr>
            <td>${location.locationName}</td>
            <td class="text-end text-nowrap">
              <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
              data-bs-target="#editLocationModal" data-id="${location.id}">
              <i class="fa-solid fa-pencil fa-fw"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deleteLocationModal" data-id="${location.id}">
                  <i class="fa-solid fa-trash fa-fw"></i>
                </button>
              </td>
            </tr>`;
          });
        }
        $("#locationTableBody").html(rows);
      }
      else {
        //console.log("Search error: " + result.status.description);
      }
    });
  }
});

$("#refreshBtn").click(function () {

  //spin class added to indicate loading, will be removed in the complete callback of the ajax request in the load functions
  $("#refreshIcon").addClass("spin");

  //timeout 500ms so that refresh animation shows
  setTimeout(function () {

    const tab = activeTab();
    if (tab === "personnel") {
      $("#filterPersonnelDepartment").val("");
      $("#filterPersonnelLocation").val("");
      loadPersonnel();
    }
    else if (tab === "departments") {
      $("#filterDepartmentsLocation").val("");
      loadDepartments();
    }
    else if (tab === "locations") {
      loadLocations();
    }

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
  else if (tab === "departments") {
    openModal("filterDepartmentsModal");

    if ($("#filterDepartmentsLocation option").length === 0) {
      populateDropdown("#filterDepartmentsLocation", "php/getAllLocations.php", "id", "name", true);
    }

  }
  else if (tab === "locations") {
    //location doesn't need filter
    $("#filterBtn").prop("disabled", true);
    openModal("filterLocationsModal");
    return;
  }
});

$("#filterPersonnelForm").on("submit", function (e) {
  e.preventDefault();

  // Gets the selected filter values
  const departmentID = $("#filterPersonnelDepartment").val();
  const locationID = $("#filterPersonnelLocation").val();

  // Make an AJAX request to the server with the selected filter values
  ajaxRequest("php/filterPersonnel.php", "GET", { departmentID: departmentID, locationID: locationID }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      let rows = "";
      const personnel = result.data.personnel;

      if (!personnel || personnel.length === 0) {
        rows = `<tr><td colspan="5">No personnel found matching the selected filters</td></tr>`;
      } else {
        personnel.forEach(person => {
          rows += `
          <tr>
            <td>${person.lastName}, ${person.firstName}</td>
            <td>${person.department}</td>
            <td>${person.location}</td>
            <td>${person.email}</td>
            <td class="text-end text-nowrap">
              <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
              data-bs-target="#editPersonnelModal" data-id="${person.id}">
              <i class="fa-solid fa-pencil fa-fw"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deletePersonnelModal" data-id="${person.id}">
                  <i class="fa-solid fa-trash fa-fw"></i>
                </button>
              </td>
            </tr>`;
        });
      }
      $("#personnelTableBody").html(rows);
      closeModal("filterPersonnelModal");
    }
    else {
      console.log("Error: " + result.status.description);
    }
  });
});

$("#filterDepartmentsForm").on("submit", function (e) {
  e.preventDefault();

  // Get the selected filter values
  const locationID = $("#filterDepartmentsLocation").val();

  // Make an AJAX request to the server with the selected filter values
  ajaxRequest("php/filterDepartments.php", "GET", { locationID: locationID }, function (result) {
    //console.log(JSON.stringify(result));
    if (result.status.code == 200) {
      let rows = "";
      const departments = result.data.departments;

      if (!departments || departments.length === 0) {
        rows = `<tr><td colspan="5">No departments found matching the selected filters</td></tr>`;
      } else {
        departments.forEach(dept => {
          rows += `
          <tr>
            <td>${dept.name}</td>
            <td>${dept.location}</td>
            <td class="text-end text-nowrap">
              <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
              data-bs-target="#editDepartmentModal" data-id="${dept.id}">
              <i class="fa-solid fa-pencil fa-fw"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deleteDepartmentModal" data-id="${dept.id}">
                  <i class="fa-solid fa-trash fa-fw"></i>
                </button>
              </td>
            </tr>`;
        });
      }
      $("#departmentTableBody").html(rows);
      closeModal("filterDepartmentsModal");
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
  // Clear search input
  $("#searchInp").val("");
  //refresh personnel table
  loadPersonnel();

});

$("#departmentsBtn").click(function () {
  //filter enabled
  $("#filterBtn").prop("disabled", false);
  // Clear search input
  $("#searchInp").val("");
  //refresh department table
  loadDepartments();

});

$("#locationsBtn").click(function () {
  // Clear search input
  $("#searchInp").val("");
  // refresh location table
  loadLocations();

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

      //populates the location dropdown and set the selected value to the employee's current location
      populateDropdown("#editPersonnelLocation", "php/getAllLocations.php", "id", "name", false, person.locationID);

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
  populateDropdown("#addPersonnelLocation", "php/getAllLocations.php", "id", "name");
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
  //confirm deletion
  $("#confirmDeletePersonnelBtn").data("id", personnelID);

  //reset
  $("#deletePersonnelMsg").show();
  $("#deletePersonnelMsg").text("Loading...");

  ajaxRequest("php/deletePersonnelByID.php", "GET", {id: personnelID}, function (result) {
    if(result.status.code == 200) {
      $("#deletePersonnelMsg").html(`Are you sure you want to delete <strong>${result.data.fullName}</strong>?
        <br><br>This will permanently remove the user.`);
    }
  })
});

//DELETE PERSONNEL BUTTON DELETE LOGIC
$("#confirmDeletePersonnelBtn").click(function () {
  let personnelID = $(this).data("id");
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
  let departmentID = $(e.relatedTarget).attr("data-id");
  //stores department & confirm deletion
  $("#confirmDeleteDepartmentBtn").data("id", departmentID);
  //hide delete by default
  $("#confirmDeleteDepartmentBtn").hide();
  $("#deleteDepartmentModal .modal-body .alert").remove();
  $("#deleteDepartmentMsg").show();

   //check if departments are assinged to location
  ajaxRequest("php/deleteDepartmentByID.php", "GET", { id: departmentID }, function (result) {

    if(result.status.code == 200 && result.data.personnelCount > 0 ){
      $("#deleteDepartmentMsg").hide();
      $("#deleteDepartmentModal .modal-body").append(
        `<div class = "alert alert-danger alert-warning" role="alert">
        Cannot delete <strong>${result.data.departmentName}</strong> department. It has <strong>${result.data.personnelCount} employees</strong> assigned to it!
        </div>
        `
      );
    } else {
      $("#confirmDeleteDepartmentBtn").show();
    }
  });
});

//DELETE DEPARTMENT BUTTON DELETE CONFIRM LOGIC
$("#confirmDeleteDepartmentBtn").click(function () {
  let departmentID = $(this).data("id");

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
  let locationID = $(e.relatedTarget).attr("data-id");
  $("#confirmDeleteLocationBtn").data("id", locationID);
  //hide delete by default
  $("#confirmDeleteLocationBtn").hide();
  $("#deleteLocationModal .modal-body .alert").remove();
  $("#deleteLocationMsg").show();

  //check if departments are assinged to location
  ajaxRequest("php/deleteLocationByID.php", "GET", { id: locationID }, function (result) {

    if(result.status.code == 200 && result.data.departmentCount > 0 ){
      $("#deleteLocationMsg").hide();
      $("#deleteLocationModal .modal-body").append(
        `<div class = "alert alert-danger alert-warning" role="alert">
        Cannot delete <strong>${result.data.locationName}</strong> location. It has <strong>${result.data.departmentCount} departments</strong> assigned to it!
        </div>
        `
      );
    } else {
      $("#confirmDeleteLocationBtn").show();
    }
  });
});

//DELETE LOCATION BUTTON DELETE CONFIRM LOGIC
$("#confirmDeleteLocationBtn").click(function () {
  let locationID = $(this).data("id");

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
      let rows = "";

      result.data.forEach(person => {
        rows += `
          <tr>
            <td>${person.lastName}, ${person.firstName}</td>
            <td>${person.department}</td>
            <td>${person.location}</td>
            <td>${person.email}</td>
            <td class="text-end text-nowrap">
              <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
              data-bs-target="#editPersonnelModal" data-id="${person.id}">
              <i class="fa-solid fa-pencil fa-fw"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deletePersonnelModal" data-id="${person.id}">
                  <i class="fa-solid fa-trash fa-fw"></i>
                </button>
              </td>
            </tr>`;
      });

      $("#personnelTableBody").html(rows);

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
      let rows = "";

      result.data.forEach(department => {
        rows += `
          <tr>
            <td>${department.name}</td>
            <td>${department.location}</td>
            <td class="text-end text-nowrap">
              <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
              data-bs-target="#editDepartmentModal" data-id="${department.id}">
              <i class="fa-solid fa-pencil fa-fw"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deleteDepartmentModal" data-id="${department.id}">
                  <i class="fa-solid fa-trash fa-fw"></i>
                </button>
              </td>
            </tr>`;
      });

      $("#departmentTableBody").html(rows);

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
      let rows = "";

      result.data.forEach(location => {
        rows += `
          <tr>
            <td>${location.name}</td>
            <td class="text-end text-nowrap">
              <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
              data-bs-target="#editLocationModal" data-id="${location.id}">
              <i class="fa-solid fa-pencil fa-fw"></i>
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal"
                  data-bs-target="#deleteLocationModal" data-id="${location.id}">
                  <i class="fa-solid fa-trash fa-fw"></i>
                </button>
              </td>
            </tr>`;
      });

      $("#locationTableBody").html(rows);

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
  const $dropdown = $(selector);
  $dropdown.empty();

  if (includeAllOption) {
    $dropdown.append(
      $("<option>", {
        value: "",
        text: "All"
      })
    );
  }

  ajaxRequest(url, "GET", {}, function (result) {
    if (result.status.code == 200) {
      result.data.forEach(item => {
        $dropdown.append(
          $("<option>", {
            value: item[valueKey],
            text: item[textKey]
          })
        );
      });
      if (selectedValue !== null) {
        $dropdown.val(selectedValue);
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

$(document).ready(function () {

  $(".modal").on("hide.bs.modal", function () {
    const focused = this.querySelector(":focus");
    if (focused) focused.blur();
  });

  loadPersonnel();
  loadDepartments();
  loadLocations();
});
