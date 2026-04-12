const GrantedPasses = () => {
  const passes = [];

  const out = (id) => alert(`OUT time marked for ${id}`);
  const inn = (id) => alert(`IN time marked for ${id}`);

  return (
    <div className="card">
      <h3>Granted Passes</h3>
      {passes.map(p => (
        <div key={p.id} className="request">
          <p>{p.student} - {p.id}</p>
          <button onClick={() => out(p.id)}>OUT</button>
          <button onClick={() => inn(p.id)}>IN</button>
        </div>
      ))}
    </div>
  );
};

export default GrantedPasses;
