export const LIFECYCLE_THRESHOLDS = {
  seed: {
    maxSearchAcceleration: 0.05,
    maxVideoVelocity: 1,
    maxCreatorAdoptionRate: 0.5,
  },
  emerging: {
    minSearchAcceleration: 0.05,
    maxSearchAcceleration: 0.30,
    minVideoVelocity: 1,
    maxVideoVelocity: 10,
  },
  growing: {
    minSearchAcceleration: 0.30,
    maxSearchAcceleration: 1.0,
    minVideoVelocity: 10,
    maxVideoVelocity: 50,
  },
  viral: {
    minSearchAcceleration: 1.0,
    minVideoVelocity: 50,
    minCreatorAdoptionRate: 5,
  },
  saturated: {
    maxSearchAcceleration: 0.10,
    minSearchVolume: 70,
  },
  declining: {
    maxSearchAcceleration: -0.05,
  },
};
