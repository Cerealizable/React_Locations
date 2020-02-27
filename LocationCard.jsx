import React from "react";
import GoogleMapReact from "google-map-react";
import { Col, Button } from "reactstrap";
import LocationMarker from "./LocationMarker";
import PropTypes from "prop-types";

const LocationCard = props => {
  const onEditClick = e => {
    e.preventDefault();
    props.edit(props.location);
  };

  // * Starting picture for google maps
  const center = {
    lat: props.location.latitude,
    lng: props.location.longitude
  };

  return (
    <React.Fragment>
      <Col>
        <div className="main-card mb-3 card">
          <div style={{ height: "250px", width: "100%" }}> {/* Styling is based on example use */}
            <GoogleMapReact
              bootstrapURLKeys={{
                key: process.env.REACT_APP_GOOGLE_API_KEY
              }}
              defaultCenter={center}
              defaultZoom={18}
            >
              <LocationMarker
                className="font-icon-lg"
                lat={props.location.latitude}
                lng={props.location.longitude}
              />
            </GoogleMapReact>
          </div>
          <div className="card-body">
            <div>
              <h5 className="menu-header-title">
                {props.location.lineOne} {props.location.lineTwo}
              </h5>
            </div>
            <div className="card-subtitle">
              {props.location.city} {props.location.zip}
            </div>
            <div>
              State: {props.location.state.name}
            </div>
            <div>
              Location Type: {props.location.locationType.name}
            </div>
            <Button
              className="mb-2 mr-2 btn btn-pill btn-info"
              onClick={onEditClick}
            >
              Edit
            </Button>
          </div>
        </div>
      </Col>
    </React.Fragment>
  );
};

LocationCard.propTypes = {
  center: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  zoom: PropTypes.number,
  location: PropTypes.shape({
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
  }),
  edit: PropTypes.func.isRequired
};

export default LocationCard;
