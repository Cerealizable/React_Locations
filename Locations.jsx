import React from "react";
import * as locationsServices from "../../services/locationsServices";
import { Row } from "reactstrap";
import { Route, withRouter } from "react-router-dom";
import ReactPaginate from "react-paginate";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import LocationCard from "./LocationCard";
import PropTypes from "prop-types";
import LocationMarker from "./LocationMarker";
import GoogleMapReact from "google-map-react";


const center = {
  lat: 34.009215,
  lng: -118.185124
};

class Locations extends React.Component {
  state = {
    locations: [],
    editLocation: {},
    //react paginate
    activePage: 1,
    numLocationsPerPage: 6,
    totalPages: 8
  };

  componentDidMount() {
    this.getAllLocationsCall(
      this.state.activePage - 1,
      this.state.numLocationsPerPage
    );
  }

  getAllLocationsCall = (pageIndex, pageSize) => {
    locationsServices
      .getAllLocations(pageIndex, pageSize)
      .then(this.onGetAllLocationsSuccess)
      .catch(this.onGetAllLocationsError);
  };

  onGetAllLocationsSuccess = response => {
    let locations = response.item.pagedItems;

    this.setState(() => {
      return {
        mappedLocations: locations.map(this.mapLocationCard),
        allLocations: locations,
        mappedMarkers: locations.map(this.mapMarker)
      };
    });
  };

  onGetAllLocationsError = error => {

    Swal.fire({
      title: "Sorry! Could not obtain locations",
      text: "Internal server error." + error,
      icon: "danger",
      showCancelButton: true
    });
  };

  mapLocationCard = location => (
    <LocationCard
      key={"Location_" + location.id}
      location={location}
      delete={this.confirmDelete}
      edit={this.populateFormFields}
    />
  );

  mapMarker = location => {
    return <LocationMarker lat={location.latitude} lng={location.longitude} />;
  };

  onCreateLocationClick = e => {
    e.preventDefault();
    this.props.history.push("/locations/add");
  };

  populateFormFields = locationObj => {
    this.setState(() => {
      return (
        { editLocation: locationObj },
        this.props.history.push("/locations/add", locationObj)
      );
    });
  };

  confirmDelete = locationId => {
    Swal.fire({
      title: "Are your sure?",
      text: "This location will be permenantly deleted.",
      icon: "warning",
      showCancelButton: true
    }).then(value => {
      if (value.value) {
        this.deleteLocation(locationId);
      } else {
        toast("Location will not be deleted.");
      }
    });
  };

  deleteLocation = locationId => {
    locationsServices
      .deleteLocationById(locationId)
      .then(this.onDeleteSuccess)
      .catch(this.onDeleteError);
  };

  onDeleteSuccess = () => {
    this.getAllLocationsCall(
      this.state.activePage - 1,
      this.state.numLocationsPerPage
    );
  };

  onDeleteError = () => {
    Swal.fire({
      title: "Sorry cannot delete that location at this time",
      text: "please try again later.",
      icon: "danger",
      showCancelButton: true
    });
  };

  changePage = page => {
    this.setState(() => ({ currentPage: page }));
    return this.getAllLocationsCall(
      page.selected,
      this.state.numLocationsPerPage
    );
  };

  render() {
    return (
      <React.Fragment>
        <div className="app-page-title">
          <div className="page-title-wrapper d-flex">
            <div className="page-title-heading">
              <div className="page-title-icon">
                <i className="pe-7s-map-marker icon-gradient bg-tempting-azure" />
              </div>
              <div>
                <h3>Locations</h3>
              </div>
            </div>
            <div>
              <Route
                path="/locations"
                exact
                render={() => (
                  <div >
                    <button
                      className="mb-2 mr-2 btn-icon btn-pill btn btn-success"
                      onClick={this.onCreateLocationClick}
                    >
                      <i className="pe-7s-map-marker"> </i>Add Location
                    </button>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
        <div style={{ height: "250px", width: "100%" }}>
          <GoogleMapReact
            bootstrapURLKeys={{
              key: process.env.REACT_APP_GOOGLE_API_KEY
            }}
            defaultCenter={center}
            defaultZoom={18}
          >
            {this.state.mappedMarkers}
          </GoogleMapReact>
        </div>
        <Route
          path="/locations"
          exact
          render={() => (
            <div>
              <Row>{this.state.mappedLocations}</Row>
              <Row className="d-flex justify-content-center">
                <ReactPaginate
                  previousLabel={"previous"}
                  nextLabel={"next"}
                  pageCount={this.state.totalPages}
                  onPageChange={this.changePage}
                  containerClassName={"pagination"}
                  activeClassName={"active"}
                />
              </Row>
            </div>
          )}
        />
      </React.Fragment>
    );
  }
}

Locations.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  })
};

export default withRouter(Locations);
