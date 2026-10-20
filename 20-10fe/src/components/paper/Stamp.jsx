// Tem bưu chính: viền dashed, lõi đào "20/10", biến thể ẩn danh "? ♡" và tem logo lớp
function Stamp({
  variant = 'date',
  size = 'md',
  rotate,
  animate = false,
  delay,
  inline = false,
  className = '',
  style,
}) {
  const classes = [
    'stamp',
    `stamp--${variant}`,
    size !== 'md' && `stamp--${size}`,
    animate && 'stamp--in',
    inline && 'stamp--inline',
    className,
  ].filter(Boolean).join(' ')

  const css = { ...style }
  if (rotate !== undefined) css['--rot'] = `${rotate}deg`
  if (delay !== undefined) css['--delay'] = `${delay}s`

  return (
    <span className={classes} style={css} aria-hidden="true">
      <span className="stamp__core">
        {variant === 'anon' && <>?<br />♡</>}
        {variant === 'date' && <>20<br />10</>}
      </span>
    </span>
  )
}

export default Stamp
