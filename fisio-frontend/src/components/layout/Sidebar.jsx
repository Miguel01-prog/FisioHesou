import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <nav style={{ width: '200px', background: '#eee', padding: '20px' }}>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/users">Users</NavLink>
        </li>
      </ul>
    </nav>
  );
}
