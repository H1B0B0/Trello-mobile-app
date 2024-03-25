import React from 'react';
import Stages from '../components/stages';
import { render, fireEvent } from '@testing-library/react-native';

describe('Stages', () => {
    it('should find stages container', () => {
        const { getByTestId } = render(<Stages />);
        const stageContainer = getByTestId('stageContainer');

        expect(stageContainer).toBeTruthy();
    });
});