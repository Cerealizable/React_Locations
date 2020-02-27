import React from "react";
import Swal from "sweetalert2";
import { Formik, Form, Field } from "formik";
import * as LocationServices from "../../services/locationsServices";
import locationValidationSchema from "./locationValidationSchema";
import PlacesAutocomplete, { geocodeByAddress } from "react-places-autocomplete";
import Tabs, { TabPane } from "rc-tabs";
import ScrollableInkTabBar from "rc-tabs/lib/ScrollableInkTabBar";
import TabContent from "rc-tabs/lib/SwipeableTabContent";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

class LocationForm extends React.Component {
  state = {
    formData: "",
    address: "",
    activeKey: "1"
  };

  componentDidMount() {
    this.populateMenu();
    this.stateFiller();
  }

  populateMenu = () => {
    LocationServices.getAllStates()
      .then(this.onGetAllStatesSuccess)
      .catch(this.onGetAllTypesError);
    LocationServices.getAllLocationTypes()
      .then(this.onGetAllLocationTypesSuccess)
      .catch(this.onGetAllTypesError);
  };

  stateFiller = () => {
    if (
      (this.props.location && this.props.location.state) ||
      this.props.locationData
    ) {
      const { location, locationData } = this.props;
      this.setState(() => {
        return {
          formData: {
            locationTypeId: location
              ? location.state.locationType.id.toString()
              : locationData.locationType.id.toString(),
            lineOne: location ? location.state.lineOne : locationData.lineOne,
            lineTwo: location ? location.state.lineTwo : locationData.lineTwo,
            city: location ? location.state.city : locationData.city,
            zip: location ? location.state.zip : locationData.zip,
            stateId: location ? location.state.state.id : locationData.state.id,
            latitude: location
              ? location.state.latitude
              : locationData.latitude,
            longitude: location
              ? location.state.longitude
              : locationData.longitude
          },
          activeKey: "2"
        };
      });
    } else {
      this.setState(() => {
        return {
          formData: {
            locationTypeId: "",
            lineOne: "",
            lineTwo: "",
            city: "",
            zip: "",
            stateId: "",
            latitude: "",
            longitude: ""
          }
        };
      });
    }
  };



  handleSearchChange = searchedAddress => {
    this.setState(prevState => {
      return {
        ...prevState,
        address: searchedAddress
      };
    });
  };

  handleSearchSelect = (selectedAddress, values) => {
    this.setState(prevState => {
      return {
        ...prevState,
        address: selectedAddress
      };
    });
    geocodeByAddress(address)
      .then(this.searchResult)
      .then(res => this.setLocationData(res, values))
      .catch(this.searchError);
  };

  setLocationData = (data, values) => {
    this.setState(prevState => {
      return {
        ...prevState,
        formData: {
          ...data,
          locationTypeId: values.locationTypeId
        }
      };
    });
  };

  searchResult = result => {
    let addressData = result[0].address_components;
    let geometryData = result[0].geometry.location;

    // Takes received addressData and returns an object from making key : value pairs based on the type and the long_name
    // This solution resolves google maps bringing back random lengths of array, instead dynamically selecting 
    const address = addressData.reduce(
      // eslint-disable-next-line camelcase
      (seed, { long_name, types }) => (
        // eslint-disable-next-line camelcase
        types.forEach(t => (seed[t] = long_name)), seed
      ),
      {}
    );

    let stateIndex = this.state.states.findIndex(
      state => state.name === address.administrative_area_level_1
    );

    if (address.street_number !== undefined) {
      return {
        lineOne: address.street_number + " " + address.route,
        city: address.locality,
        stateId: this.state.states[stateIndex].id,
        zip: address.postal_code,
        latitude: geometryData.lat(),
        longitude: geometryData.lng()
      };
    } else {
      this.searchError();
    }
  };

  searchError = error => {
    toast("Could not retrieve specified address.", error);
  };

  onGetAllLocationTypesSuccess = response => {
    let locationTypes = response.item;
    this.setState(() => {
      return {
        locationType: locationTypes,
        mappedLocationType: locationTypes.map(this.mapLocationType)
      };
    });
  };

  onGetAllStatesSuccess = response => {
    let _states = response.item;
    this.setState(() => {
      return {
        states: _states,
        mappedState: _states.map(this.mapStates)
      };
    });
  };

  onGetAllTypesError = error => {
    toast("Could not retrieve form data.", error);
  };

  onAddSubmit = (values, { resetForm }) => {
    const location = {
      locationTypeId: values.locationTypeId,
      lineOne: values.lineOne,
      lineTwo: values.lineTwo,
      city: values.city,
      zip: values.zip,
      stateId: values.stateId,
      latitude: values.latitude,
      longitude: values.longitude
    };

    LocationServices.addLocation(location)
      .then(this.onAddLocationSuccess)
      .catch(this.onAddLocationError);

    resetForm(this.state.formData);
  };

  onAddLocationSuccess = result => {
    this.props.onChangeValue(result.item);
    toast("Succesfully added a location");
  };

  onAddLocationError = error => {

    Swal.fire({
      title: "AWH!",
      text: "your location failed to add: " + error,
      icon: "error",
      button: "X"
    });
  };

  onEditSubmit = values => {
    const location = {
      locationTypeId: values.locationTypeId,
      lineOne: values.lineOne,
      lineTwo: values.lineTwo,
      city: values.city,
      zip: values.zip,
      stateId: values.stateId,
      latitude: values.latitude,
      longitude: values.longitude
    };

    if (this.props.location && this.props.location.state) {
      LocationServices.editLocation(this.props.location.state.id, location)
        .then(this.onEditLocationSuccess)
        .catch(this.onEditLocationError);
    } else {
      LocationServices.editLocation(this.props.locationData.id, location)
        .then(this.onEditLocationSuccess)
        .catch(this.onEditLocationError);
    }
  };

  onEditLocationSuccess = () => {
    if (this.props.location && this.props.location.state) {
      Swal.fire({
        title: "Successfully updated your Location!",
        icon: "success",
        showClass: {
          popup: "animated fadeInDown"
        },
        showConfirmButton: false,
        timer: 1500
      });
      this.props.history.goBack();
    } else {
      Swal.fire({
        title: "Successfully updated your Location!",
        icon: "success",
        showClass: {
          popup: "animated fadeInDown"
        },
        showConfirmButton: false,
        timer: 1500
      }).then(
        setTimeout(() => {
          this.props.onUpdateValue();
        }, 1700)
      );
    }
  };

  onEditLocationError = error => {

    Swal.fire({
      title: "AWH!",
      text: "something went wrong: " + error,
      icon: "error",
      button: "X"
    });
  };

  returnToLocations = () => {
    this.props.history.push("/locations");
  };

  mapLocationType = locationType => (
    <option key={locationType.id} value={locationType.id}>
      {locationType.name}
    </option>
  );

  mapStates = state => (
    <option key={state.id} value={state.id}>
      {state.name}
    </option>
  );

  onNextClick = e => {
    e.preventDefault();
    this.setState(() => {
      let activeKey = "2";
      return { activeKey };
    });
  };

  onBackClick = e => {
    e.preventDefault();
    this.setState(() => {
      let activeKey = "1";
      return { activeKey };
    });
  };

  checkState = () => {
    if (
      (this.props.location !== undefined && this.props.location.state) ||
      this.props.locationData
    ) {
      return this.onEditSubmit;
    } else {
      return this.onAddSubmit;
    }
  };

  render() {
    return (
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={this.state.formData}
          onSubmit={this.checkState()}
          validationSchema={locationValidationSchema}
          isInitialValid={
            this.props.location || this.props.locationData ? true : false
          }
        >
          {props => {
            const {
              values,
              touched,
              errors,
              handleSubmit,
              isValid,
              isSubmitting
            } = props;
            return (
              <Form
                onSubmit={handleSubmit}
                className="container-fluid"
                style={{ display: "grid" }}
              >
                <div className="mb-3 card">
                  <div className="card-header"> add A location </div>
                  <div className="card-body">
                    <Tabs
                      activeKey={this.state.activeKey}
                      renderTabBar={() => <ScrollableInkTabBar />}
                      renderTabContent={() => <TabContent animatedWithMargin />}
                      className="mt-n3"
                    >
                      <TabPane tab="user input" key="1">
                        <h2>
                          <b>Some info we need from you</b>
                        </h2>
                        <PlacesAutocomplete
                          value={this.state.address}
                          onChange={this.handleSearchChange}
                          onSelect={address =>
                            this.handleSearchSelect(address, values)
                          }
                          types={"address"}
                        >
                          {({
                            getInputProps,
                            suggestions,
                            getSuggestionItemProps,
                            loading
                          }) => (
                            <div>
                              <input
                                {...getInputProps({
                                  placeholder: "address...",
                                  className: "form-control"
                                })}
                              />
                              <div className="autocomplete-dropdown-container">
                                {loading && <div>Loading...</div>}
                                {suggestions.map(suggestion => {
                                  const className = suggestion.active
                                    ? "suggestion-item--active"
                                    : "suggestion-item";
                                  const style = suggestion.active
                                    ? {
                                        backgroundColor: "#fafafa",
                                        cursor: "pointer"
                                      }
                                    : {
                                        backgroundColor: "#ffffff",
                                        cursor: "pointer"
                                      };
                                  return (
                                    <div
                                      key={suggestions.id}
                                      {...getSuggestionItemProps(suggestion, {
                                        className,
                                        style
                                      })}
                                    >
                                      <span>{suggestion.description}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </PlacesAutocomplete>
                        <h5>
                          <b>What type of location is this?</b>
                        </h5>
                        <Field
                          name="locationTypeId"
                          className={"form-control"}
                          component="select"
                          as="select"
                          value={values.locationTypeId}
                        >
                          <option>Select a Location Type</option>
                          {this.state.mappedLocationType}
                        </Field>
                        {errors.locationTypeId && touched.locationTypeId && (
                          <span className="text-danger">
                            {errors.locationTypeId}
                          </span>
                        )}
                        <h5>
                          <b>Any extra info we should know?</b>
                        </h5>
                        <Field
                          id="lineTwo"
                          name="lineTwo"
                          placeholder="apt, suite # etc..."
                          component="input"
                          className="form-control"
                          value={values.lineTwo}
                        />
                        {touched.lineTwo && errors.lineTwo && (
                          <div className="text-danger">{errors.lineTwo}</div>
                        )}
                        <div className="d-block text-right card-footer d-flex justify-content-between">
                          <button
                            type="button"
                            onClick={this.onNextClick}
                            className="mb-2 mr-2 btn btn-hover-shine btn-info btn-wide btn-shadow"
                            disabled={!isValid}
                          >
                            Next
                          </button>
                        </div>
                      </TabPane>
                      <TabPane tab="verify" key="2">
                        <h2>
                          <b>Does this info look correct?</b>{" "}
                        </h2>
                        <label> Address</label>
                        <Field
                          id="lineOne"
                          name="lineOne"
                          placeholder=""
                          component="input"
                          className="form-control"
                          value={values.lineOne}
                          disabled={true}
                        />
                        {touched.lineOne && errors.lineOne && (
                          <div className="text-danger">{errors.lineOne}</div>
                        )}
                        <label>City </label>
                        <Field
                          id="city"
                          name="city"
                          placeholder=""
                          component="input"
                          className="form-control"
                          disabled={true}
                          value={values.city}
                        />
                        {touched.city && errors.city && (
                          <div className="text-danger">{errors.city}</div>
                        )}
                        <label>Zip </label>
                        <Field
                          id="zip"
                          name="zip"
                          placeholder=""
                          component="input"
                          className="form-control"
                          disabled={true}
                          value={values.zip}
                        />
                        {touched.zip && errors.zip && (
                          <div className="text-danger">{errors.zip}</div>
                        )}
                        <label>State </label>
                        <Field
                          name="stateId"
                          component="select"
                          className={"form-control"}
                          disabled={true}
                          as="select"
                        >
                          <option value></option>
                          {this.state.mappedState}
                        </Field>
                        {errors.stateId && touched.stateId && (
                          <span className="text-danger">{errors.stateId}</span>
                        )}
                        <div className="d-block text-right card-footer d-flex justify-content-between">
                          <button
                            type="button"
                            className="mb-2 mr-2 btn btn-danger btn-wide btn-shadow"
                            onClick={this.onBackClick}
                          >
                            No
                          </button>
                          <button
                            type="submit"
                            className="mb-2 mr-2 btn btn-success btn-wide btn-hover-shine btn-shadow"
                            disabled={!isValid || isSubmitting}
                          >
                            Yes
                          </button>
                        </div>
                      </TabPane>
                    </Tabs>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    );
  }
}

LocationForm.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
    goBack: PropTypes.func
  }),
  onChangeValue: PropTypes.func.isRequired,
  onUpdateValue: PropTypes.func,
  location: PropTypes.shape({
    state: PropTypes.shape({
      id: PropTypes.number,
      locationType: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string
      }),
      lineOne: PropTypes.string,
      lineTwo: PropTypes.string,
      city: PropTypes.string,
      zip: PropTypes.string,
      state: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string
      }),
      latitude: PropTypes.number,
      longitude: PropTypes.number
    }).isRequired
  }),
  locationData: PropTypes.shape({
    id: PropTypes.number,
    locationType: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    }),
    lineOne: PropTypes.string,
    lineTwo: PropTypes.string,
    city: PropTypes.string,
    zip: PropTypes.string,
    state: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    }),
    latitude: PropTypes.number,
    longitude: PropTypes.number
  })
};

export default LocationForm;
