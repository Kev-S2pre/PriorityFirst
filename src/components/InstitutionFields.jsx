import React from 'react';
import InstitutionPicker from './InstitutionPicker';
import {
  INSTITUTION_TYPES,
  getDepartmentOptions,
  getDepartmentLabel
} from '../data/profileOptions';

/**
 * Institution type → verified institution → matching course / department, kept in step:
 * changing an earlier field clears the ones after it so they always belong together.
 *
 * value: { institutionType, institution, institutionId, department }
 */
export default function InstitutionFields({ idPrefix, value, onChange, classification }) {
  const { institutionType = '', institution = '', institutionId = '', department = '' } = value;
  const departmentOptions = getDepartmentOptions(institutionType, classification);
  const departmentLabel = getDepartmentLabel(institutionType, classification);
  const departmentKnown = !department || departmentOptions.some(g => g.options.includes(department));

  return (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor={`${idPrefix}-institution-type`}>Institution type (optional)</label>
        <select
          id={`${idPrefix}-institution-type`}
          className="form-select"
          value={institutionType}
          onChange={(e) => onChange({ institutionType: e.target.value, institution: '', institutionId: '', department: '' })}
        >
          <option value="">None</option>
          {INSTITUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {institutionType && (
        <div className="form-group">
          <label className="form-label" htmlFor={`${idPrefix}-institution`}>
            {institutionType === 'school' ? 'School' : INSTITUTION_TYPES.find(t => t.value === institutionType)?.label}
          </label>
          <InstitutionPicker
            key={institutionType}
            id={`${idPrefix}-institution`}
            institutionType={institutionType}
            value={{ name: institution, id: institutionId }}
            onChange={({ name, id }) => onChange({ ...value, institution: name, institutionId: id })}
          />
          {institutionType === 'school' && (
            <span className="form-hint">From CHED's official list of higher education institutions.</span>
          )}
        </div>
      )}

      {(institutionType || classification === 'Athlete') && departmentOptions.length > 0 && (
        <div className="form-group">
          <label className="form-label" htmlFor={`${idPrefix}-department`}>{departmentLabel} (optional)</label>
          <select
            id={`${idPrefix}-department`}
            className="form-select"
            value={departmentKnown ? department : ''}
            onChange={(e) => onChange({ ...value, department: e.target.value })}
          >
            <option value="">Select {departmentLabel.toLowerCase()}…</option>
            {departmentOptions.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map(option => <option key={option} value={option}>{option}</option>)}
              </optgroup>
            ))}
          </select>
          {!departmentKnown && (
            <span className="form-hint" style={{ color: 'var(--warning)' }}>
              “{department}” isn't on the list. Choose the matching {departmentLabel.toLowerCase()}.
            </span>
          )}
        </div>
      )}
    </>
  );
}
