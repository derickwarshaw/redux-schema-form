import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import SchemaForm from './SchemaForm';
import * as actions from './actionCreators';

class ReduxSchemaForm extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onModelChange = this.onModelChange.bind(this);
    this.registerValidationListener = this.registerValidationListener.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.validators = [];
  }

  componentWillMount() {
    // Create the redux store for this form instance
    this.props.actions.createSchemaFormStore(
      this.props.id,
      this.props.model
    );
  }

  componentWillUnmount() {
    // Remove the redux store for this form instance
    this.props.actions.removeSchemaFormStore(
      this.props.id,
    );
  }

  /**
   * Update the redux store values for this form on change of any field within the form
   * @param key {string} - the name of the modified form element
   * @param value {object} - the updated value
   */
  onModelChange(key, validationResult) {
    // Update the form data in the store
    this.props.actions.setSchemaFormData(
      this.props.id,
      key,
      validationResult
    );
  }

  /**
   * Each component calls back to register itself. Anytime we want to validate the
   * entire form, we can call each validator function. Commonly, this occurs when
   * submit is pressed to block the submit action, and highlight any invalid fields.
   * @param validator
   */
  registerValidationListener(validator) {
    this.validators.push(validator);
  }

  /**
   * Check that all fields are valid and call onSubmit callback.
   */
  onSubmit() {
    if (this.validateAll(true) && this.props.onSubmit) {
      // the model is valid, strip off internal validation state
      let cleanModel = {};
      for (let key in this.props.model) {
        if (this.props.model[key].value) {
          cleanModel[key] = this.props.model[key].value;
        }
      }
      this.props.onSubmit(cleanModel);
    }
  }

  /**
   * Validate all fields in the form.
   * @param markFieldsDirty {boolean} If true, each field is marked 'dirty' as if a user had touched it. If false,
   *   the field is validated, but not marked dirty, which usually means it won't be highlighted as an error.
   * @returns {boolean} If true, all fields are valid. If false, one or more fields are invalid.
   */
  validateAll(markFieldsDirty) {
    let formValid = true;
    this.validators.forEach((validator)=> {
      let validationResult = validator(markFieldsDirty);
      if (markFieldsDirty) {
        // Call the normal onModelChange handler to set the updated validation state into the store
        this.onModelChange(validationResult.key, validationResult);
      }
      if (!validationResult.valid) {
        formValid = false;
      }
    });
    return formValid;
  }

  render() {
    let {schema, form, model, componentMap} = this.props;
    return (
      <SchemaForm
        schema={schema}
        form={form}
        model={model}
        onModelChange={this.onModelChange}
        mapper={componentMap}
        extraProps={{
          registerValidationListener: this.registerValidationListener,
          onSubmit: this.onSubmit,
        }}
      />
    );
  }
}

ReduxSchemaForm.propTypes = {
  id: PropTypes.string.isRequired,
  schema: PropTypes.object.isRequired,
  form: PropTypes.array,
  model: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
  actions: PropTypes.object.isRequired,
  componentMap: PropTypes.object.isRequired,
};

ReduxSchemaForm.defaultProps = {
  form: ["*"],
  onSubmit: null,
};

function mapStateToProps(state, ownProps) {
  let newModel = {};
  for (let key in ownProps.model) {
    newModel[key] = {value: ownProps.model[key]};
  }
  return {
    model: state.schemaForm[ownProps.id] || newModel,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ReduxSchemaForm);
