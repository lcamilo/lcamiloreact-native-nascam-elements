import React from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  View,
  TextInput,
  Animated,
  Easing,
  Platform,
  StyleSheet,
} from 'react-native';

import { nodeType, renderNode, patchWebProps } from '../helpers';
import { fonts, withTheme, ViewPropTypes, TextPropTypes } from '../config';

import Icon from '../icons/Icon';

import MaskResolver from '../mask/mask-resolver';

const renderText = (content, defaultProps, style) =>
  renderNode(Text, content, {
    ...defaultProps,
    style: StyleSheet.flatten([style, defaultProps && defaultProps.style]),
  });

class Input extends React.Component {
  constructor(props) {
    super(props);
    this._resolveMaskHandler();
  }

  componentDidMount() {
    this._bindProps(this.props);
  }

  componentDidUpdate(prevProps) {
    this._bindProps(prevProps);
  }

  updateValue(text) {
    let maskedText = this._getMaskedValue(text);
    const rawText = this.props.includeRawValueInChangeText
      ? this.getRawValueFor(maskedText)
      : undefined;

    return {
      maskedText,
      rawText,
    };
  }

  isValid() {
    return this._maskHandler.validate(
      this._getDefaultValue(this.props.value),
      this._getOptions()
    );
  }

  getRawValueFor(value) {
    return this._maskHandler.getRawValue(
      this._getDefaultValue(value),
      this._getOptions()
    );
  }

  getRawValue() {
    return this.getRawValueFor(this.props.value);
  }

  getDisplayValueFor(value) {
    return this._getMaskedValue(value);
  }

  _getOptions() {
    return this.props.maskOptions;
  }

  _mustUpdateValue(newValue) {
    return this.props.value !== newValue;
  }

  _resolveMaskHandler() {
    this._maskHandler = MaskResolver.resolve(this.props.maskType);
  }

  _bindProps(nextProps) {
    if (this.props.type !== nextProps.type) {
      this._resolveMaskHandler();
    }
  }

  _getDefaultMaskedValue(value) {
    if (this._getDefaultValue(value) === '') {
      return '';
    }

    return this._getMaskedValue(value);
  }

  _getMaskedValue(value) {
    const defaultValue = this._getDefaultValue(value);
    if (defaultValue === '') {
      return '';
    }

    return this._maskHandler.getValue(defaultValue, this._getOptions());
  }

  _getDefaultValue(value) {
    if (value === undefined || value === null) {
      return '';
    }

    return value;
  }

  getElement() {
    return this._inputElement;
  }

  _onChangeText(text) {
    if (!this._checkText(text)) {
      return;
    }

    const { maskedText, rawText } = this.updateValue(text);

    if (this.props.onChangeText) {
      this._trySetNativeProps(maskedText);
      this.props.onChangeText(maskedText, rawText);
    }
  }

  _trySetNativeProps(maskedText) {
    try {
      const element = this.getElement();
      element.setNativeProps && element.setNativeProps({ text: maskedText });
    } catch (error) {
      // silent
    }
  }

  _checkText(text) {
    if (this.props.checkText) {
      return this.props.checkText(this.props.value, text);
    }

    return true;
  }

  _getKeyboardType() {
    return this.props.keyboardType || this._maskHandler.getKeyboardType();
  }

  shakeAnimationValue = new Animated.Value(0);

  focus() {
    this.input.focus();
  }

  blur() {
    this.input.blur();
  }

  clear() {
    this.input.clear();
  }

  isFocused() {
    return this.input.isFocused();
  }

  setNativeProps(nativeProps) {
    this.input.setNativeProps(nativeProps);
  }

  shake = () => {
    const { shakeAnimationValue } = this;

    shakeAnimationValue.setValue(0);
    // Animation duration based on Material Design
    // https://material.io/guidelines/motion/duration-easing.html#duration-easing-common-durations
    Animated.timing(shakeAnimationValue, {
      duration: 375,
      toValue: 3,
      ease: Easing.bounce,
    }).start();
  };

  render() {
    const {
      containerStyle,
      disabled,
      disabledInputStyle,
      inputContainerStyle,
      leftIcon,
      leftIconContainerStyle,
      rightIcon,
      rightIconContainerStyle,
      InputComponent,
      inputStyle,
      errorProps,
      errorStyle,
      errorMessage,
      label,
      labelStyle,
      labelProps,
      theme,
      ...attributes
    } = this.props;

    const translateX = this.shakeAnimationValue.interpolate({
      inputRange: [0, 0.5, 1, 1.5, 2, 2.5, 3],
      outputRange: [0, -15, 0, 15, 0, -15, 0],
    });

    return (
      <View
        style={StyleSheet.flatten([styles.container, containerStyle])}
      >
        {renderText(
          label,
          { style: labelStyle, ...labelProps },
          styles.label(theme)
        )}

        <Animated.View
          style={StyleSheet.flatten([
            styles.inputContainer(theme),
            inputContainerStyle,
            { transform: [{ translateX }] },
          ])}
        >
          {leftIcon && (
            <View
              style={StyleSheet.flatten([
                styles.iconContainer,
                leftIconContainerStyle,
              ])}
            >
              {renderNode(Icon, leftIcon)}
            </View>
          )}

          <InputComponent
            testID="RNE__Input__text-input"
            underlineColorAndroid="transparent"
            editable={!disabled}
            {...patchWebProps(attributes)}
            ref={ref => {
              this.input = ref;
            }}
            style={StyleSheet.flatten([
              styles.input,
              inputStyle,
              disabled && styles.disabledInput,
              disabled && disabledInputStyle,
            ])}
            keyboardType={this._getKeyboardType()}
            onChangeText={text => this._onChangeText(text)}
            value={this.getDisplayValueFor(this.props.value)}
          />

          {rightIcon && (
            <View
              style={StyleSheet.flatten([
                styles.iconContainer,
                rightIconContainerStyle,
              ])}
            >
              {renderNode(Icon, rightIcon)}
            </View>
          )}
        </Animated.View>

        {!!errorMessage && (
          <Text
            {...errorProps}
            style={StyleSheet.flatten([
              styles.error(theme),
              errorStyle && errorStyle,
            ])}
          >
            {errorMessage}
          </Text>
        )}
      </View>
    );
  }
}

Input.propTypes = {
  containerStyle: ViewPropTypes.style,
  disabled: PropTypes.bool,
  disabledInputStyle: TextPropTypes.style,
  inputContainerStyle: ViewPropTypes.style,
  leftIcon: nodeType,
  leftIconContainerStyle: ViewPropTypes.style,
  rightIcon: nodeType,
  rightIconContainerStyle: ViewPropTypes.style,
  inputStyle: TextPropTypes.style,
  InputComponent: PropTypes.elementType,
  errorProps: PropTypes.object,
  errorStyle: TextPropTypes.style,
  errorMessage: PropTypes.string,
  label: PropTypes.node,
  labelStyle: TextPropTypes.style,
  labelProps: PropTypes.object,
  theme: PropTypes.object,
  maskType: PropTypes.string,
  options: PropTypes.object,
};

Input.defaultProps = {
  InputComponent: TextInput,
};

const styles = {
  container: {
    width: '100%',
    paddingHorizontal: 10,
  },
  disabledInput: {
    opacity: 0.5,
  },
  inputContainer: theme => ({
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'center',
    borderColor: theme.colors.grey3,
  }),
  iconContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10
  },
  input: {
    alignSelf: 'center',
    color: 'black',
    fontSize: 18,
    flex: 1,
    minHeight: 40,
  },
  error: theme => ({
    margin: 5,
    fontSize: 12,
    color: theme.colors.error,
  }),
  label: theme => ({
    fontSize: 16,
    color: theme.colors.grey3,
    ...Platform.select({
      android: {
        ...fonts.android.bold,
      },
      default: {
        fontWeight: 'bold',
      },
    }),
  }),
};

export { Input };
export default withTheme(Input, 'Input');
